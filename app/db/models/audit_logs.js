'use strict';
module.exports = (sequelize, Sequelize) => {
    const AuditLogs = sequelize.define(
        'AuditLogs',
        {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            operation: {
                type: Sequelize.STRING(20),
                allowNull: false,
                // comment: '1 for create, 2 for update, 3 for delete, 4 for find',
            },
            requestPath: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            requestMethod: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            responseStatus: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            responseMessage: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            error: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            duration: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            model: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            moduleId: {
                type: Sequelize.UUID,
                allowNull: true,
                association: {
                    model: 'Module',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'Module',
                },
            },
            routerIpAddress: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            localIpAddress: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            deviceName: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            operatingSystem: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            browser: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            userAgent: {
                type: Sequelize.TEXT,
                allowNull: true,
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
            tableName: 'audit_logs',
            customOptions: {
                createdBy: { value: true },
            },
        }
    );
    return AuditLogs;
};
