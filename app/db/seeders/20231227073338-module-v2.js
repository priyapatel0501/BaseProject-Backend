'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('module_master', [
            {
                id: '0a3773d3-5450-4f00-a7d0-adb3c1f51309',
                name: 'View',
                type: '3',
                description: 'User - View',
                status: '1',
                parentId: '41a48d08-4d13-4cd8-bb74-3e383a2fbaf8',
                createdAt: '2022-09-06 12:06:15',
                updatedAt: '2023-12-27 07:30:47',
            },

            {
                id: 'fcd957f0-2f3c-43d9-8bfa-fe9d602703a4',
                name: 'View',
                type: '3',
                description: 'Role - View',
                status: '1',
                parentId: '9d254493-df8f-4f4d-be22-8401433dfd25',
                createdAt: '2022-09-06 12:04:20',
                updatedAt: '2023-12-27 07:30:29',
            },
            {
                id: '75e632bb-43c1-49c2-977b-268e387eefbd',
                name: 'Update Hierarchy',
                type: '3',
                description: 'Role - Update Hierarchy',
                status: '1',
                parentId: '9d254493-df8f-4f4d-be22-8401433dfd25',
                createdAt: '2022-09-12 07:17:20',
                updatedAt: '2023-12-27 07:21:43',
            },
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete(
            'module_master',
            {
                id: {
                    [Sequelize.Op.in]: [
                        '0a3773d3-5450-4f00-a7d0-adb3c1f51309',
                        '75e632bb-43c1-49c2-977b-268e387eefbd',
                        'fcd957f0-2f3c-43d9-8bfa-fe9d602703a4',
                    ],
                },
            },
            {}
        );
    },
};
