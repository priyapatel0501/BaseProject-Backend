'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        return Promise.all([
            queryInterface.addColumn('user', 'isPasswordChangeRequired', {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            }),
        ]);
    },

    async down(queryInterface, Sequelize) {
        return Promise.all([queryInterface.removeColumn('user', 'isPasswordChangeRequired')]);
    },
};
