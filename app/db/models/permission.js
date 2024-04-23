'use strict';
module.exports = (sequelize, Sequelize) => {
    const Permission = sequelize.define(
        'Permission',
        {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            roleId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'Role',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                    belongsToAlias: 'Role',
                },
            },
            moduleId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'Module',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                    belongsToAlias: 'Module',
                },
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                onCreate: sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                onUpdate: sequelize.literal('CURRENT_TIMESTAMP'),
            },
        },
        {
            tableName: 'permission',
            customOptions: {
                createdBy: { value: true, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
            },
        }
    );
    return Permission;
};
