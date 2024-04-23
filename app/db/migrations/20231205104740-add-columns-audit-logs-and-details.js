'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        return Promise.all([
            queryInterface.addColumn('audit_logs', 'requestPath', {
                type: Sequelize.STRING,
                allowNull: false,
                after: 'moduleId',
            }),
            queryInterface.addColumn('audit_logs', 'requestMethod', {
                type: Sequelize.STRING,
                allowNull: false,
                after: 'requestPath',
            }),
            queryInterface.addColumn('audit_logs', 'responseStatus', {
                type: Sequelize.INTEGER,
                allowNull: false,
                after: 'requestMethod',
            }),
            queryInterface.addColumn('audit_logs', 'responseMessage', {
                type: Sequelize.STRING,
                allowNull: true,
                after: 'responseStatus',
            }),
            queryInterface.addColumn('audit_logs', 'error', {
                type: Sequelize.STRING,
                allowNull: true,
                after: 'responseMessage',
            }),
            queryInterface.addColumn('audit_logs', 'duration', {
                type: Sequelize.STRING,
                allowNull: false,
                after: 'error',
            }),
        ]);
    },

    async down(queryInterface, Sequelize) {
        return Promise.all([
            queryInterface.removeColumn('audit_logs', 'requestPath'),
            queryInterface.removeColumn('audit_logs', 'requestMethod'),
            queryInterface.removeColumn('audit_logs', 'responseStatus'),
            queryInterface.removeColumn('audit_logs', 'responseMessage'),
            queryInterface.removeColumn('audit_logs', 'duration'),
            queryInterface.removeColumn('audit_logs', 'error'),
        ]);
    },
};
