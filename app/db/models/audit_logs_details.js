'use strict';
module.exports = (sequelize, Sequelize) => {
    const AuditLogsDetails = sequelize.define(
        'AuditLogsDetails',
        {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
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
                get() {
                    const rawValue = this.getDataValue('oldValues');
                    return rawValue ? JSON.parse(rawValue) : null;
                },
                set(value) {
                    value ? this.setDataValue('oldValues', JSON.stringify(value)) : null;
                },
            },
            newValues: {
                type: Sequelize.TEXT,
                allowNull: true,
                get() {
                    const rawValue = this.getDataValue('newValues');
                    return rawValue ? JSON.parse(rawValue) : null;
                },
                set(value) {
                    value ? this.setDataValue('newValues', JSON.stringify(value)) : null;
                },
            },
            affectedColumns: {
                type: Sequelize.TEXT,
                allowNull: true,
                get() {
                    const rawValue = this.getDataValue('affectedColumns');
                    return rawValue ? JSON.parse(rawValue) : null;
                },
                set(value) {
                    value ? this.setDataValue('affectedColumns', JSON.stringify(value)) : null;
                },
            },
            requestParameters: {
                type: Sequelize.TEXT,
                allowNull: true,
                get() {
                    const rawValue = this.getDataValue('requestParameters');
                    return rawValue ? JSON.parse(rawValue) : null;
                },
                set(value) {
                    value ? this.setDataValue('requestParameters', JSON.stringify(value)) : null;
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
            tableName: 'audit_logs_details',
        }
    );
    return AuditLogsDetails;
};
