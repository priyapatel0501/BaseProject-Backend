const { getNamespace } = require('cls-hooked');
const db = require('../../app/db/models');
const { performance } = require('perf_hooks');
const common = require('./common-function');
const _ = require('lodash');
const { status } = require('./messages/api.response');

const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../../app/db/audit-logger/config.json')[env];

module.exports = {
    async getPermissionByToken(user) {
        try {
            let permissions = [];
            if (user?.Role?.isSystemAdmin) {
                permissions = await db.Module.findAll({
                    attributes: [['id', 'moduleId']],
                    raw: true,
                });
            } else {
                permissions = await db.Permission.findAll({
                    attributes: ['moduleId'],
                    where: {
                        roleId: user.roleId,
                    },
                    raw: true,
                });
            }
            const moduleIds = permissions.map((i) => i.moduleId);
            return moduleIds;
        } catch (err) {
            Promise.reject(err);
        }
    },

    async bulkUpdate(dataToUpdate, modelName, referenceField, transaction) {
        let ids = dataToUpdate.map((m1) => `'${m1[referenceField]}'`);
        let singleFields = 'SET ';

        let keys = Object.keys(dataToUpdate[0]).filter((f1) => f1 != referenceField);

        keys.forEach((element, index) => {
            singleFields = singleFields + ` ${element} = CASE `;
            dataToUpdate.map((m1) => {
                let myValue;

                if (m1[element]) {
                    myValue = `"${m1[element]}"`;
                } else {
                    myValue = null;
                }

                singleFields = singleFields + `WHEN ${referenceField} = "${m1[referenceField]}" THEN ${myValue} `;
            });

            singleFields = singleFields + `ELSE ${element} END`;

            index != keys.length - 1 ? (singleFields = singleFields + ', ') : '';
        });

        const [results, metadata] = await db.sequelize.query(
            `
            UPDATE ${modelName.tableName}
            ${singleFields}
            WHERE
            id IN(${ids});
            `,
            {
                type: db.sequelize.QueryTypes.UPDATE,
                transaction,
            }
        );

        return { results, metadata };
    },

    /**
     * Central function to create audit logs for all GET APIs and failed APIs. Data Manipulation Logs are auto created by sequelize hooks.
     * @param {*} req request object
     * @param {*} res response object
     * @param {*} data response data
     * @param {*} operation action performed
     * @param {*} userId current user id. If userId is null then default will taken from cls-hooked userId.
     * @param {*} moduleId moduleId: default false
     * @returns AuditLogId
     */
    async createAuditLog(req, res, data, operation, userId = null, moduleId = null) {
        // Transaction Begin
        const transaction = await db.sequelize.transaction();
        try {
            // check if audit logger is enabled else return.
            if (!config.enable) return false;

            if (operation === 'VIEW' && req.params.id)
                // change operation to View One if req params has id.
                operation = 'VIEW ONE';

            // Time took to send response.
            //? Note: This time is approximate. Actual response time depends on multiple factor including Internal Speed and data transmission.
            const duration = (performance.now() - req.startTime).toFixed(2);

            // Get Session namespace
            const namespace = getNamespace(config.clsNamespace);

            // If userId is null. Take from session
            if (!userId) userId = namespace.get(config.clsUserId);

            // If moduleId is null. Take from session
            if (!moduleId) moduleId = namespace.get(config.clsModuleId);

            // response message.
            var msg = null;
            var errMsg = null;

            // Client OS and Browser
            const { os, browser, userAgent } = common.getParsedUA(req.headers['user-agent']);

            // If response data has message, add in db.
            if (typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, 'message')) msg = data.message;
            if (typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, 'error')) errMsg = data.error;

            // Request Client IP.
            const clientIP = common.getUserIP(req);

            // Create AuditLog
            const auditLog = await db.AuditLogs.create(
                {
                    operation: operation,
                    requestPath: req.originalUrl,
                    requestMethod: req.method,
                    responseStatus: res.statusCode === status.NotModified ? status.OK : res.statusCode,
                    responseMessage: msg,
                    error: errMsg,
                    duration: duration,
                    model: null,
                    moduleId: moduleId,
                    routerIpAddress: clientIP,
                    localIpAddress: clientIP,
                    deviceName: null,
                    operatingSystem: os,
                    browser: browser,
                    userAgent: userAgent,
                    createdBy: userId,
                },
                {
                    transaction,
                }
            );

            // request params
            var requestParameters = null;

            if (config.enableAuditDetailModel) {
                // If request method is GET than take req.query.
                if (req.method === 'GET' && req.query && Object.keys(req.query).length > 0) requestParameters = req.query;
                // If request method is POST/PUT/PATCH/DELETE than take req.body.
                else if (req.body && Object.keys(req.body).length > 0) requestParameters = req.body;

                if (requestParameters) {
                    requestParameters = _.omit(requestParameters, ['password', 'oldPassword', 'newPassword', 'confirmPassword']);

                    // Create Details
                    await db.AuditLogsDetails.create(
                        {
                            auditLogId: auditLog.id,
                            documentId: req.params.id || null,
                            oldValues: null,
                            newValues: null,
                            affectedColumns: null,
                            requestParameters: requestParameters,
                            createdAt: null,
                            updatedAt: null,
                        },
                        {
                            transaction,
                        }
                    );
                }
            }
            // commit transaction
            await transaction.commit();
            return auditLog.id;
        } catch (error) {
            // rollback transaction
            await transaction.rollback();
            common.throwException(error, 'Create Audit Log Common');
            return false;
        }
    },
};
