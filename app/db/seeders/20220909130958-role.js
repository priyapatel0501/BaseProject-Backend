'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'role',
            [
                {
                    id: '4db03064-6826-4a94-8943-5dbbba2f5de2',
                    name: 'System Admin',
                    isSystemAdmin: '1',
                    isAdmin: '0',
                    systemDefault: true,
                    description: 'System Admin Description',
                    status: '1',
                    level: 0,
                    createdAt: '2022-09-16 07:39:04',
                    updatedAt: '2022-09-16 07:39:04',
                },
                {
                    id: '766b7ee4-9347-4752-84ab-24b9cc7c996e',
                    name: 'Admin',
                    isSystemAdmin: '0',
                    isAdmin: '1',
                    systemDefault: true,
                    description: 'Admin Description',
                    status: '1',
                    level: 1,
                    createdAt: '2022-09-16 07:41:10',
                    updatedAt: '2022-09-16 07:41:10',
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('role', null, {});
    },
};
