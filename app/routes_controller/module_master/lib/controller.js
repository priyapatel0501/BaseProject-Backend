const { Op } = require('sequelize');
const { status, common, enums } = require('../../../../utils');
const db = require('../../../db/models');

// create module
exports.create = async (req, res) => {
    try {
        const formData = {
            name: req.body.name,
            type: req.body.type,
            description: req.body.description,
            createdBy: req.user.id,
        };
        if (req.body?.parentId) {
            formData.parentId = req.body.parentId;
        }
        await db.Module.create(formData);
        return res.status(status.OK).json({ message: 'Module Created Successfully.' });
    } catch (err) {
        return common.throwException(err, 'Created Module', req, res);
    }
};

// find all module
exports.findAll = async (req, res) => {
    try {
        var whereCondition = {};

        if (req.query?.status) {
            whereCondition.status = req.query?.status;
        }

        const permission = await db.Permission.findAll({
            attributes: ['moduleId'],
            where: {
                roleId: req.user.roleId,
            },
            raw: true,
        });
        if (!req.user.Role.isSystemAdmin) {
            whereCondition.id = { [Op.in]: permission.map((i) => i.moduleId) };
            whereCondition.isAdmin = false;
            whereCondition.level = { [Op.gt]: req.user.Role.level };
        }

        const data = await db.Module.findAll({
            where: {
                ...whereCondition,
            },
            include: [
                {
                    model: db.Module,
                    as: 'Parent',
                    attributes: ['id', 'name', 'type', 'status'],
                },
            ],
            order: [['createdAt', 'ASC']],
        });
        return res.status(status.OK).json({ data: data });
    } catch (err) {
        return common.throwException(err, 'Get Module', req, res);
    }
};

// find one module
exports.findOne = async (req, res) => {
    try {
        const data = await db.Module.findOne({
            where: {
                id: req.params.id,
            },
            include: [
                {
                    model: db.Module,
                    as: 'Parent',
                    attributes: ['id', 'name', 'type', 'status'],
                },
            ],
        });
        if (!data) {
            return res.status(status.NotFound).json({ message: 'Module not found!' });
        }
        return res.status(status.OK).json({ data: data });
    } catch (err) {
        return common.throwException(err, 'Get Module By id', req, res);
    }
};

// update module
exports.update = async (req, res) => {
    try {
        const formData = {
            name: req.body.name,
            type: req.body.type,
            description: req.body.description,
            createdBy: req.user.id,
        };
        if (req.body?.parentId) {
            formData.parentId = req.body.parentId;
        }

        if (req.params.id == req.body.parentId) {
            return res.status(status.NotFound).json({ message: 'Can not point self.' });
        }
        const module = await db.Module.findOne({
            where: {
                id: req.params.id,
            },
        });
        if (!module) {
            return res.status(status.NotFound).json({ message: 'Module not found.' });
        }
        module.set(formData);
        await module.save();

        return res.status(status.OK).json({ message: 'Module Updated Successfully.' });
    } catch (err) {
        return common.throwException(err, 'Update Module', req, res);
    }
};

// update module status
exports.updateStatus = async (req, res) => {
    try {
        const module = await db.Module.findOne({
            where: {
                id: req.params.id,
            },
        });

        if (!module) {
            return res.status(status.NotFound).json({ message: 'Module not found.' });
        }
        module.set({
            status: module.status === enums.Status.Active.value ? enums.Status.Inactive.value : enums.Status.Active.value,
            updatedBy: req.user.id,
        });

        await module.save();

        return res.status(status.OK).json({
            message: 'Module updated successfully.',
        });
    } catch (err) {
        return common.throwException(err, 'Update Module Status', req, res);
    }
};

// delete module
exports.delete = async (req, res) => {
    try {
        const module = await db.Module.destroy({
            where: { id: req.params.id },
        });
        if (!module) {
            return res.status(status.NotFound).json({ message: 'Module not found.' });
        }
        return res.status(status.OK).json({
            message: 'Module deleted successfully.',
        });
    } catch (err) {
        return common.throwException(err, 'Delete Module', req, res);
    }
};

// update parent module
exports.updateParent = async (req, res) => {
    try {
        if (req.params.id == req.body.parentId) {
            return res.status(status.NotFound).json({ message: 'Can not point self.' });
        }

        const module = await db.Module.findOne({
            where: {
                id: req.params.id,
            },
        });
        if (!module) {
            return res.status(status.NotFound).json({ message: 'Module not found.' });
        }

        const parent = await db.Module.findOne({
            where: {
                id: req.body.parentId,
            },
        });

        if (!parent) {
            return res.status(status.NotFound).json({ message: 'Parent not found.' });
        }

        if (module.type == 2 ? module.type < parent.type : module.type <= parent.type) {
            return res.status(status.NotFound).json({ message: 'Invalid Parent.' });
        }

        module.set({ parentId: req.body.parentId });
        await module.save();
        return res.status(status.OK).json({ message: 'Module Updated Successfully.' });
    } catch (err) {
        return common.throwException(err, 'Update parent Module', req, res);
    }
};
