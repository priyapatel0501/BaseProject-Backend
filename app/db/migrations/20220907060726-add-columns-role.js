'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        return Promise.all([
            queryInterface.addColumn('role', 'createdBy', {
                type: Sequelize.UUID,
                references: {
                    model: 'user',
                    key: 'id',
                },
                allowNull: true,
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            }),
            queryInterface.addColumn('role', 'updatedBy', {
                type: Sequelize.UUID,
                references: {
                    model: 'user',
                    key: 'id',
                },
                allowNull: true,
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            }),
            queryInterface.addColumn('role', 'deletedBy', {
                type: Sequelize.UUID,
                references: {
                    model: 'user',
                    key: 'id',
                },
                allowNull: true,
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            }),
        ]);
    },

    async down(queryInterface, Sequelize) {
        return Promise.all([
            queryInterface.removeColumn('role', 'createdBy'),
            queryInterface.removeColumn('role', 'updatedBy'),
            queryInterface.removeColumn('role', 'deletedBy'),
        ]);
    },
};
