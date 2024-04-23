var _sequelize = require('sequelize');
var _lodash = require('lodash');
var _helpers = require('./helpers');
const { performance } = require('perf_hooks');
const common = require('../../../utils/lib/common-function');
const { getNamespace } = require('cls-hooked');

const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/config.json')[env];

exports.init = (sequelize) => {
    const log = config.log || console.log;

    function beforeHook(operation) {
        const beforeHook = function beforeHook(instance, opt) {
            try {
                if (opt && opt.disableLog) {
                    if (config.debug) {
                        log('disableLog opt: is true, not logging');
                    }
                    return;
                }

                if (opt && opt.individualHooks) {
                    if (config.debug) {
                        log('individualHooks is true. Skipping bulk hook.');
                    }
                    return;
                }

                const destroyOperation = Array.isArray(instance)
                    ? _helpers.checkDestroyOperation(operation, Array.from(instance[0]._changed))
                    : _helpers.checkDestroyOperation(operation, Array.from(instance._changed));

                if (Array.isArray(instance)) {
                    instance.forEach((ins) => {
                        let previousVersion = ins._previousDataValues;
                        let currentVersion = ins.dataValues;

                        previousVersion = _lodash.omitBy(
                            previousVersion,
                            (i) => i != null && typeof i === 'object' && !(i instanceof Date)
                        );
                        previousVersion = _lodash.omit(previousVersion, config.exclude);
                        currentVersion = _lodash.omitBy(currentVersion, (i) => i != null && typeof i === 'object' && !(i instanceof Date));
                        currentVersion = _lodash.omit(currentVersion, config.exclude);

                        const { oldValues, newValues } = _helpers.getChangedColumns(
                            currentVersion,
                            previousVersion,
                            ins._changed,
                            config.exclude
                        );

                        if (destroyOperation || (oldValues && newValues)) {
                            if (!ins.context) {
                                ins.context = {};
                            }

                            ins.context.oldValues = oldValues;
                            ins.context.newValues = newValues;
                            ins.context.affectedColumns = _helpers.omitFromArray(Array.from(ins._changed), config.exclude);
                        }
                    });
                } else {
                    let previousVersion = instance._previousDataValues;
                    let currentVersion = instance.dataValues;

                    previousVersion = _lodash.omitBy(previousVersion, (i) => i != null && typeof i === 'object' && !(i instanceof Date));
                    previousVersion = _lodash.omit(previousVersion, config.exclude);
                    currentVersion = _lodash.omitBy(currentVersion, (i) => i != null && typeof i === 'object' && !(i instanceof Date));
                    currentVersion = _lodash.omit(currentVersion, config.exclude);

                    const { oldValues, newValues } = _helpers.getChangedColumns(
                        currentVersion,
                        previousVersion,
                        instance._changed,
                        config.exclude
                    );

                    if (destroyOperation || (oldValues && newValues)) {
                        if (!instance.context) {
                            instance.context = {};
                        }

                        instance.context.oldValues = oldValues;
                        instance.context.newValues = newValues;
                        instance.context.affectedColumns = _helpers.omitFromArray(Array.from(instance._changed), config.exclude);
                    }
                }
            } catch (error) {
                console.log(error);
                common.throwException(error, 'Create Audit Log Before Hook');
            }
        };
        return beforeHook;
    }

    function afterHook(operation) {
        const afterHook = async function afterHook(instance, opt) {
            try {
                let namespace = getNamespace(config.clsNamespace);

                if (opt && opt.disableLog) {
                    if (config.debug) {
                        log('disableLog opt: is true, not logging');
                    }
                    return;
                }

                if (opt && opt.individualHooks) {
                    if (config.debug) {
                        log('individualHooks is true. Skipping bulk hook.');
                    }
                    return;
                }

                if (config.failHard && namespace && !namespace.get(config.clsUserId)) {
                    throw new Error(`The CLS clsUserId - ${config.clsUserId} is not defined.`);
                }
                if (config.failHard && namespace && !namespace.get(config.clsModuleId)) {
                    throw new Error(`The CLS clsModuleId - ${config.clsModuleId} is not defined.`);
                }

                const destroyOperation = Array.isArray(instance)
                    ? _helpers.checkDestroyOperation(operation, Array.from(instance[0]._changed))
                    : _helpers.checkDestroyOperation(operation, Array.from(instance._changed));

                if (Array.isArray(instance)) {
                    const auditLogObject = {
                        operation: destroyOperation ? 'destroy' : operation,
                        model: this.name,
                        moduleId: namespace.get(config.clsModuleId) || null,
                        createdBy: namespace.get(config.clsUserId) || null,
                    };
                    const auditLogDetailObjects = [];
                    instance.forEach((ins) => {
                        if (ins.context && ((ins.context.oldValues && ins.context.newValues) || destroyOperation)) {
                            auditLogDetailObjects.push({
                                documentId: ins.id,
                                oldValues: ins.context.oldValues,
                                newValues: ins.context.newValues,
                                affectedColumns: ins.context.affectedColumns,
                            });
                        }
                    });

                    await createAuditLog(auditLogObject, auditLogDetailObjects, opt, namespace);
                } else {
                    if (instance.context && ((instance.context.oldValues && instance.context.newValues) || destroyOperation)) {
                        const auditLogObject = {
                            operation: destroyOperation ? 'DESTROY' : operation.toUpperCase(),
                            model: this.name,
                            moduleId: namespace.get(config.clsModuleId) || null,
                            createdBy: namespace.get(config.clsUserId) || null,
                        };
                        const auditLogDetailObjects = [
                            {
                                documentId: instance.id,
                                oldValues: instance.context.oldValues,
                                newValues: instance.context.newValues,
                                affectedColumns: instance.context.affectedColumns,
                            },
                        ];

                        await createAuditLog(auditLogObject, auditLogDetailObjects, opt, namespace);
                    }
                }

                return null;
            } catch (error) {
                common.throwException(error, 'Audit Create After Hook');
                return false;
            }
        };
        return afterHook;
    }

    function bulkBeforeHook(operation) {
        const bulkBeforeHook = async function bulkBeforeHook(instance, opt) {
            try {
                if (opt && opt.disableLog) {
                    if (config.debug) {
                        log('disableLog opt: is true, not logging');
                    }
                    return;
                }

                if (opt && opt.individualHooks) {
                    if (config.debug) {
                        log('individualHooks is true. Skipping bulk hook.');
                    }
                    return;
                }

                if (!instance.fields) {
                    instance.fields = [];
                }

                const destroyOperation = _helpers.checkDestroyOperation(instance.type || operation, instance?.fields);

                var transaction = null;

                if (instance.transaction) {
                    transaction = instance.transaction;
                }

                const queryOptions = {};

                if (!destroyOperation) {
                    queryOptions.attributes = ['id', ...instance.fields];
                }
                const rows = await this.findAll({
                    ...queryOptions,
                    where: instance.where,
                    raw: true,
                    transaction,
                });

                const auditData = [];

                rows.forEach((row) => {
                    let previousVersion = row;
                    let currentVersion = instance.attributes || {};

                    previousVersion = _lodash.omitBy(previousVersion, (i) => i != null && typeof i === 'object' && !(i instanceof Date));
                    previousVersion = _lodash.omit(previousVersion, config.exclude);
                    currentVersion = _lodash.omitBy(currentVersion, (i) => i != null && typeof i === 'object' && !(i instanceof Date));
                    currentVersion = _lodash.omit(currentVersion, config.exclude);

                    const { oldValues, newValues, affectedColumns } = _helpers.getChangedColumns(
                        currentVersion,
                        previousVersion,
                        instance.fields,
                        config.exclude
                    );

                    if (destroyOperation || (oldValues && newValues)) {
                        const data = {
                            documentId: row.id,
                            oldValues: oldValues,
                            newValues: newValues,
                            affectedColumns: affectedColumns,
                        };

                        if (instance.type.toLowerCase() === 'bulkdelete') {
                            data.oldValues = previousVersion;
                            data.newValues = null;
                            data.affectedColumns = null;
                        }
                        auditData.push(data);
                    }
                });

                instance.auditData = auditData;
            } catch (error) {
                console.log(error);
                common.throwException(error, 'Create Audit Log Bulk Before Hook');
            }
        };
        return bulkBeforeHook;
    }

    function bulkAfterHook(operation) {
        const bulkAfterHook = async function bulkAfterHook(instance, opt) {
            try {
                let namespace = getNamespace(config.clsNamespace);

                if (opt && opt.disableLog) {
                    if (config.debug) {
                        log('disableLog opt: is true, not logging');
                    }
                    return;
                }

                if (opt && opt.individualHooks) {
                    if (config.debug) {
                        log('individualHooks is true. Skipping bulk hook.');
                    }
                    return;
                }

                if (config.failHard && namespace && !namespace.get(config.clsUserId)) {
                    throw new Error(`The CLS clsUserId - ${config.clsUserId} is not defined.`);
                }
                if (config.failHard && namespace && !namespace.get(config.clsModuleId)) {
                    throw new Error(`The CLS clsModuleId - ${config.clsModuleId} is not defined.`);
                }

                const destroyOperation = _helpers.checkDestroyOperation(instance.type || operation, instance.fields || []);

                if (Array.isArray(instance.auditData) && instance.auditData.length > 0) {
                    const auditLogObject = {
                        operation: destroyOperation
                            ? instance.type.toLowerCase() === 'bulkdelete'
                                ? 'HARD DELETE'
                                : 'DELETE'
                            : operation.toUpperCase(),
                        model: this.name,
                        moduleId: namespace.get(config.clsModuleId) || null,
                        createdBy: namespace.get(config.clsUserId) || null,
                    };
                    const auditLogDetailObjects = instance.auditData;

                    var actionOptions = {};
                    if (instance.transaction) {
                        actionOptions.transaction = instance.transaction;
                    }
                    await createAuditLog(auditLogObject, auditLogDetailObjects, actionOptions, namespace);
                }

                return null;
            } catch (error) {
                common.throwException(error, 'Audit Create After Hook');
                return false;
            }
        };
        return bulkAfterHook;
    }

    async function createAuditLog(auditLogObject, auditLogDetailObjects = [], opt, namespace) {
        var transaction;
        if (opt?.transaction) {
            transaction = opt.transaction;
        } else {
            transaction = await sequelize.transaction();
        }
        try {
            const AuditLogs = sequelize.model('AuditLogs');
            const AuditLogDetails = sequelize.model('AuditLogsDetails');

            const duration = (performance.now() - namespace.get(config.clsStartTime)).toFixed(2);
            const { os, browser, userAgent } = common.getParsedUA(namespace.get(config.userAgent));

            auditLogObject.duration = duration;
            auditLogObject.requestPath = namespace.get(config.requestPath);
            auditLogObject.requestMethod = namespace.get(config.requestMethod);

            auditLogObject.routerIpAddress = namespace.get(config.clientIP);
            auditLogObject.localIpAddress = namespace.get(config.clientIP);

            auditLogObject.operatingSystem = os;
            auditLogObject.browser = browser;
            auditLogObject.userAgent = userAgent;

            // Keeping fixed 200 since hook is only called after data has been created.
            auditLogObject.responseStatus = 200;

            const auditLog = await AuditLogs.create(auditLogObject, {
                transaction,
            });

            namespace.set(config.clsAuditLogId, auditLog.id);

            auditLogDetailObjects.forEach((row) => {
                let cleanCol = auditLogObject.operation.includes('CREATE');

                row.oldValues = cleanCol ? null : row.oldValues;
                row.affectedColumns = cleanCol ? null : row.affectedColumns;
                row.auditLogId = auditLog.id;
            });

            if (config.enableAuditDetailModel) {
                await AuditLogDetails.bulkCreate(auditLogDetailObjects, {
                    transaction,
                });
            }

            if (!opt?.transaction) {
                await transaction.commit();
            }

            return true;
        } catch (error) {
            if (!opt?.transaction) {
                await transaction.rollback();
            }
            common.throwException(error, 'Create Audit Log Hook');
            return false;
        }
    }

    _lodash.assignIn(_sequelize.Model, {
        hasAuditLogs: function hasAuditLogs() {
            if (!config.enable) return true;
            if (config.debug) {
                this.options.auditEnabled = true;
            }

            // CREATE
            this.addHook('beforeCreate', beforeHook('create'));
            this.addHook('afterCreate', afterHook('create'));

            // UPDATE
            this.addHook('beforeUpdate', beforeHook('update'));
            this.addHook('afterUpdate', afterHook('update'));

            // DESTROY/DELETE
            this.addHook('beforeDestroy', beforeHook('destroy'));
            this.addHook('afterDestroy', afterHook('destroy'));

            // BULK CREATE
            this.addHook('beforeBulkCreate', beforeHook('bulkCreate'));
            this.addHook('afterBulkCreate', afterHook('bulkCreate'));

            // BULK UPDATE
            this.addHook('beforeBulkUpdate', bulkBeforeHook('bulkUpdate'));
            this.addHook('afterBulkUpdate', bulkAfterHook('bulkUpdate'));

            // BULK DESTROY/DELETE
            this.addHook('beforeBulkDestroy', bulkBeforeHook('bulkDelete'));
            this.addHook('afterBulkDestroy', bulkAfterHook('bulkDelete'));

            return true;
        },
    });

    return true;
};

module.exports = exports;
