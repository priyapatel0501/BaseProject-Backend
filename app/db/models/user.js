'use strict';
const bcrypt = require('bcrypt');

module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define(
        'User',
        {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            firstName: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            lastName: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            fullName: {
                type: Sequelize.VIRTUAL,
                get() {
                    return `${this.firstName} ${this.lastName}`;
                },
            },
            mobile: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false,
                set(value) {
                    this.setDataValue('email', value?.toLowerCase());
                },
                unique: {
                    name: 'user_email',
                    msg: 'Email already exists',
                    ignoreDuplicates: true,
                },
            },
            password: {
                type: Sequelize.STRING,
                allowNull: false,
                set(value) {
                    this.setDataValue('password', bcrypt.hashSync(value, 10));
                },
            },
            roleId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'Role',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'Role',
                    hasManyAlias: 'Users',
                },
            },
            profileImage: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            isEmailVerified: {
                type: Sequelize.ENUM('0', '1'),
                allowNull: false,
                defaultValue: '0',
            },
            isPasswordChangeRequired: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            status: {
                type: Sequelize.ENUM('0', '1'),
                allowNull: false,
                defaultValue: '1',
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
            deletedAt: {
                type: Sequelize.DATE,
            },
        },
        {
            tableName: 'user',
            indexes: [{ unique: true, fields: ['email'] }],
            customOptions: {
                createdBy: { value: true },
                updatedBy: { value: true },
                deletedBy: { value: true },
            },
            defaultScope: {
                attributes: {
                    exclude: ['password'],
                },
            },
            scopes: {
                withPassword: {
                    attributes: {
                        include: ['password'],
                    },
                },
            },
        }
    );

    User.hasAuditLogs();

    return User;
};
