'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('audit_logs_details', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                defaultValue: Sequelize.UUIDV4,
                allowNull: false,
            },
            auditLogId: {
                type: Sequelize.UUID,
                references: {
                    model: 'audit_logs',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            documentId: {
                type: Sequelize.UUID,
                allowNull: true,
            },
            oldValues: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            newValues: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            affectedColumns: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: true,
                type: Sequelize.DATE,
                onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('audit_logs_details');
    },
};
