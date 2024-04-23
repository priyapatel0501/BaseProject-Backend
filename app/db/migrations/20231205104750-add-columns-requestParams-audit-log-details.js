'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        return Promise.all([
            queryInterface.addColumn('audit_logs_details', 'requestParameters', {
                type: Sequelize.STRING,
                allowNull: false,
                after: 'affectedColumns',
            }),
        ]);
    },

    async down(queryInterface, Sequelize) {
        return Promise.all([queryInterface.removeColumn('audit_logs_details', 'requestParameters')]);
    },
};
