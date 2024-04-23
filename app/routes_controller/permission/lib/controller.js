const { status, common, dbCommon } = require('../../../../utils');
const { Op } = require('sequelize');
const db = require('../../../db/models');
const Permission = db.Permission;
const Role = db.Role;

exports.create = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const permission = req.body.permission;
        let whereCondition = {};
        if (!req.user.Role.isSystemAdmin) {
            whereCondition.level = { [Op.gt]: req.user.Role.level };
        }

        // finding role
        const role = await Role.findOne({
            where: {
                id: req.params.id,
                ...whereCondition,
                [Op.and]: [
                    { id: req.params.id },
                    {
                        id: {
                            [Op.ne]: req?.user?.roleId,
                        },
                    },
                ],
                isSystemAdmin: { [Op.ne]: true },
            },
            transaction,
        });

        if (!role) {
            await transaction.rollback();
            return res.status(status.NotFound).json({
                message: 'Role not found!',
            });
        }

        // destroy any previous permission and add new
        await Permission.destroy({
            where: {
                roleId: role.id,
            },
            transaction,
        });

        // new permission array
        let permissionArray = [];

        permission.forEach(async (i) => {
            permissionArray.push({
                roleId: role.id,
                moduleId: i,
                createdBy: req.user.id,
            });
        });

        // bulk creating permission
        await Permission.bulkCreate(permissionArray, {
            transaction,
        });

        await transaction.commit();
        return res.status(status.OK).json({ message: 'Permission Added Successfully.' });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Create Permission', req, res);
    }
};

exports.findByRoleId = async (req, res) => {
    try {
        const permission = await Permission.findAll({
            where: {
                roleId: {
                    [Op.eq]: req?.params?.id,
                    [Op.ne]: req?.user?.roleId,
                },
            },
        });

        const moduleIds = permission.map((i) => i.moduleId);
        return res.status(status.OK).json({ data: moduleIds });
    } catch (err) {
        return common.throwException(err, 'Get permission by role', req, res);
    }
};

exports.findByToken = async (req, res) => {
    try {
        const data = await dbCommon.getPermissionByToken(req.user);
        return res.status(status.OK).json({ data: data });
    } catch (err) {
        return common.throwException(err, 'Get permission by token', req, res);
    }
};
