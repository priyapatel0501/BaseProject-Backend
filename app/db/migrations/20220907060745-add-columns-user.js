'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        return Promise.all([
            queryInterface.addColumn('user', 'isEmailVerified', {
                type: Sequelize.ENUM('0', '1'),
                allowNull: false,
                defaultValue: '0',
            }),
        ]);
    },

    async down(queryInterface, Sequelize) {
        return Promise.all([queryInterface.removeColumn('user', 'isEmailVerified')]);
    },
};
