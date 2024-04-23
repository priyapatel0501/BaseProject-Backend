const db = require('../../../db/models');
const { Op } = require('sequelize');
const Sequelize = require('sequelize');
const status = require('../../../../utils/index').status;
const { common, dbCommon, enums } = require('../../../../utils');

// create role
exports.create = async (req, res) => {
    try {
        const findRoleLatest = await db.Role.findOne({
            limit: 1,
            where: {
                deletedAt: null,
            },
            order: [['createdAt', 'DESC']],
            raw: true,
        });

        if (!findRoleLatest) {
            return res.status(status.NotFound).json({ message: 'Role not found.' });
        }
        const roleData = {
            name: req.body.name,
            description: req.body.description,
            level: findRoleLatest.level + 1,
            createdBy: req.user.id,
        };
        await db.Role.create(roleData);
        return res.status(status.OK).json({ message: 'Role Created Successfully.' });
    } catch (err) {
        return common.throwException(err, 'Role Created', req, res);
    }
};

// find by id
exports.findById = async (req, res) => {
    try {
        var whereCondition = {};
        if (!req.user.Role.isSystemAdmin) {
            whereCondition.isAdmin = false;
            whereCondition.level = { [Op.gt]: req.user.Role.level };
        }

        const role = await db.Role.findOne({
            where: {
                deletedAt: null,
                [Op.and]: [
                    {
                        id: req.params.id,
                    },
                    {
                        id: {
                            [Op.ne]: req?.user?.roleId,
                        },
                    },
                ],
                isSystemAdmin: false,
                ...whereCondition,
            },
        });
        if (!role) {
            return res.status(status.NotFound).json({ message: 'Role not found.' });
        }

        return res.status(status.OK).json({ data: role });
    } catch (err) {
        return common.throwException(err, 'Get Role By Id', req, res);
    }
};

// find all
exports.findAll = async (req, res) => {
    try {
        var options = {
            include: [],
            order: [['level', 'ASC']],
        };
        var whereCondition = {};

        if (!req.user.Role.isSystemAdmin) {
            whereCondition.isAdmin = false;
            whereCondition.level = { [Op.gt]: req.user.Role.level };
        }
        if (req.query?.status) {
            whereCondition.status = req.query?.status;
        }

        if (req.path.endsWith('options')) {
            whereCondition.status = enums.Status.Active.value;
            options.attributes = [
                [db.Sequelize.col('Role.id'), 'value'],
                [db.Sequelize.col('name'), 'label'],
            ];
        } else {
            options.include = [
                {
                    model: db.User,
                    as: 'CreatedByUser',
                    attributes: ['id', 'firstName', 'lastName', 'fullName'],
                },
                {
                    model: db.User,
                    as: 'UpdatedByUser',
                    attributes: ['id', 'firstName', 'lastName', 'fullName'],
                },
            ];
        }

        const role = await db.Role.findAll({
            where: {
                id: {
                    [Op.ne]: req?.user?.roleId,
                },
                isSystemAdmin: false,
                ...whereCondition,
            },
            ...options,
        });
        return res.status(status.OK).json({ data: role });
    } catch (err) {
        return common.throwException(err, 'Get Role', req, res);
    }
};

// update role by id
exports.update = async (req, res) => {
    try {
        var whereCondition = {};
        if (!req.user.Role.isSystemAdmin) {
            whereCondition.isAdmin = false;
        }
        const roleData = {
            name: req.body.name,
            description: req.body.description,
            updatedBy: req.user.id,
        };

        const role = await db.Role.findOne({
            where: {
                deletedAt: null,
                [Op.and]: [
                    { id: req.params.id },
                    {
                        id: {
                            [Op.ne]: req?.user?.roleId,
                        },
                    },
                ],
                isSystemAdmin: false,
                ...whereCondition,
            },
        });

        if (!role) {
            return res.status(status.NotFound).json({ message: 'Role not found.' });
        }

        role.set(roleData);

        await role.save();

        return res.status(status.OK).json({
            message: 'Role updated successfully.',
        });
    } catch (err) {
        return common.throwException(err, 'Update Role', req, res);
    }
};

// update role status
exports.updateStatus = async (req, res) => {
    try {
        var whereCondition = {};
        if (!req.user.Role.isSystemAdmin) {
            whereCondition.isAdmin = false;
        }

        const role = await db.Role.findOne({
            where: {
                deletedAt: null,
                id: req.params.id,

                [Op.and]: [
                    { id: req.params.id },
                    {
                        id: {
                            [Op.ne]: req?.user?.roleId,
                        },
                    },
                ],
                isSystemAdmin: false,
                ...whereCondition,
            },
        });
        if (!role) {
            return res.status(status.NotFound).json({ message: 'Role not found.' });
        }

        if (role.systemDefault) {
            return res.status(status.NotFound).json({ message: 'Can not de-activate System Default Role.' });
        }

        role.set({
            status: role.status === enums.Status.Active.value ? enums.Status.Inactive.value : enums.Status.Active.value,
            updatedBy: req.user.id,
        });

        await role.save();

        return res.status(status.OK).json({
            message: 'Status updated successfully.',
        });
    } catch (err) {
        return common.throwException(err, 'Update Role Status', req, res);
    }
};

// delete role
exports.delete = async (req, res) => {
    try {
        var whereCondition = {};
        if (!req.user.Role.isSystemAdmin) {
            whereCondition.isAdmin = false;
        }
        const role = await db.Role.findOne({
            where: {
                deletedAt: null,
                [Op.and]: [
                    { id: req.params.id },
                    {
                        id: {
                            [Op.ne]: req?.user?.roleId,
                        },
                    },
                ],
                isSystemAdmin: false,
                ...whereCondition,
            },
        });

        if (!role) {
            return res.status(status.NotFound).json({ message: 'Role not found.' });
        }

        if (role.systemDefault) {
            return res.status(status.BadRequest).json({ message: 'System Default Role can not be deleted.' });
        }

        const userCount = await role.countUsers();

        if (userCount > 0) {
            return res.status(status.BadRequest).json({ message: 'Users are associate with this Role!' });
        }

        role.set({
            status: enums.Status.Inactive.value,
            deletedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
            deletedBy: req.user.id,
        });

        await role.save();

        return res.status(status.OK).json({
            message: 'Role Deleted successfully.',
        });
    } catch (err) {
        return common.throwException(err, 'Delete Role', req, res);
    }
};

exports.updateLevel = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        let tempCount = await db.Role.count({
            where: {
                id: { [Op.in]: req.body.roleIds },
                deletedAt: null,
                level: { [Op.gt]: req.user.Role.level },
            },
            transaction: transaction,
        });

        if (tempCount != req.body.roleIds.length) {
            return res.status(status.Conflict).json({ message: 'Improper data present.' });
        }

        let priorityData = req.body.roleIds.map((m1, index) => {
            return {
                id: m1,
                level: req.user.Role.level + index + 1,
            };
        });
        await dbCommon.bulkUpdate(priorityData, db.Role, 'id', transaction);
        await transaction.commit();
        return res.status(status.OK).json({
            message: 'Role Level Updated successfully.',
        });
    } catch (err) {
        return common.throwException(err, 'Role Level Updated', req, res);
    }
};
