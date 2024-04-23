'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'user',
            [
                {
                    id: 'f2b13458-ac56-4c54-a6cb-53f879dbfe6c',
                    firstName: 'System',
                    lastName: 'admin',
                    mobile: '1234567890',
                    email: 'superadmin@gmail.com',
                    password: '$2b$10$9BEv6xyfn//eV4VTNUy49OwgnRp7Is2wSKRZZd0Lp80NVMpzmBVui',
                    status: '1',
                    createdAt: '2022-09-16 07:22:55',
                    updatedAt: '2022-09-16 07:22:55',
                    roleId: '4db03064-6826-4a94-8943-5dbbba2f5de2',
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('user', null, {});
    },
};
