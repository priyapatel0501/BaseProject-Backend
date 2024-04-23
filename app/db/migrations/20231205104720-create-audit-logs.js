'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('audit_logs', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                defaultValue: Sequelize.UUIDV4,
                allowNull: false,
            },
            operation: {
                type: Sequelize.STRING(20),
                allowNull: false,
            },
            model: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            moduleId: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'module_master',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
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
                allowNull: false,
                type: Sequelize.DATE,
            },
            createdBy: {
                type: Sequelize.UUID,
                references: {
                    model: 'user',
                    key: 'id',
                },
                allowNull: true,
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            updatedAt: {
                allowNull: true,
                type: Sequelize.DATE,
            },
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('audit_logs');
    },
};
