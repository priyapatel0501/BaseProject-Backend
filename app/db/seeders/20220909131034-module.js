'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('module_master', [
            {
                id: '5e1d0285-79b6-4d99-ade6-84cc9fbf32fb',
                name: 'Setup',
                description: 'Setup',
                type: '1',
                status: '1',
                createdAt: '2022-09-06 11:56:40',
                updatedAt: '2022-09-06 11:56:40',
                parentId: null,
            },
            {
                id: '9d254493-df8f-4f4d-be22-8401433dfd25',
                name: 'Role',
                description: 'Role',
                type: '2',
                status: '1',
                createdAt: '2022-09-06 11:56:40',
                updatedAt: '2022-09-06 11:56:40',
                parentId: '5e1d0285-79b6-4d99-ade6-84cc9fbf32fb',
            },
            {
                id: '41a48d08-4d13-4cd8-bb74-3e383a2fbaf8',
                name: 'User',
                description: 'User',
                type: '2',
                status: '1',
                createdAt: '2022-09-06 12:04:36',
                updatedAt: '2022-09-06 12:04:36',
                parentId: '5e1d0285-79b6-4d99-ade6-84cc9fbf32fb',
            },
            {
                id: 'a518315f-c4fb-480c-b710-d9a320378c6a',
                name: 'Add',
                description: 'Role Add',
                type: '3',
                status: '1',
                createdAt: '2022-09-06 11:57:14',
                updatedAt: '2022-09-06 11:57:14',
                parentId: '9d254493-df8f-4f4d-be22-8401433dfd25',
            },
            {
                id: 'd96fa055-1261-46c9-b58c-e35adcf4da1a',
                name: 'Edit',
                description: 'Role Edit',
                type: '3',
                status: '1',
                createdAt: '2022-09-06 12:04:10',
                updatedAt: '2022-09-06 12:04:10',
                parentId: '9d254493-df8f-4f4d-be22-8401433dfd25',
            },
            {
                id: 'e05c3fa9-44c6-4144-866d-8850c663615b',
                name: 'Delete',
                description: 'Role Delete',
                type: '3',
                status: '1',
                createdAt: '2022-09-06 12:04:16',
                updatedAt: '2022-09-06 12:04:16',
                parentId: '9d254493-df8f-4f4d-be22-8401433dfd25',
            },
            {
                id: '7f9c9dbd-d520-4a19-a036-ae8b76bd7e6e',
                name: 'Assign Permission',
                description: 'Role - Assign Permission',
                type: '3',
                status: '1',
                createdAt: '2022-09-12 07:17:05',
                updatedAt: '2022-09-12 07:17:05',
                parentId: '9d254493-df8f-4f4d-be22-8401433dfd25',
            },
            {
                id: '03c3c561-a254-4d8b-a3d3-6fba76c3e36e',
                name: 'Add',
                description: 'User Add',
                type: '3',
                status: '1',
                createdAt: '2022-09-06 12:04:46',
                updatedAt: '2022-09-06 12:04:46',
                parentId: '41a48d08-4d13-4cd8-bb74-3e383a2fbaf8',
            },
            {
                id: 'bc9c4a48-72bb-4ea5-bae2-c8af7c367e85',
                name: 'Edit',
                description: 'User Edit',
                type: '3',
                status: '1',
                createdAt: '2022-09-06 12:04:55',
                updatedAt: '2022-09-06 12:04:55',
                parentId: '41a48d08-4d13-4cd8-bb74-3e383a2fbaf8',
            },
            {
                id: '81c28771-7efc-4691-b10b-36d2b35eaf29',
                name: 'Delete',
                description: 'User Delete',
                type: '3',
                status: '1',
                createdAt: '2022-09-06 12:06:08',
                updatedAt: '2022-09-06 12:06:08',
                parentId: '41a48d08-4d13-4cd8-bb74-3e383a2fbaf8',
            },
            {
                id: '3566c134-44ce-4f5f-8ae5-df17b99a9be0',
                name: 'Reset Password',
                type: '3',
                description: 'Reset Password User',
                status: '1',
                createdAt: '2023-11-30 05:49:15',
                updatedAt: '2023-11-30 05:49:15',
                parentId: '41a48d08-4d13-4cd8-bb74-3e383a2fbaf8',
            },
            {
                id: 'c519611d-0e8a-4321-a9c9-57c4a0bc0c40',
                name: 'Mock Login',
                type: '3',
                description: 'Mock Login User',
                status: '1',
                createdAt: '2023-11-30 05:50:32',
                updatedAt: '2023-11-30 05:50:32',
                parentId: '41a48d08-4d13-4cd8-bb74-3e383a2fbaf8',
            },
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('module_master', null, {});
    },
};
