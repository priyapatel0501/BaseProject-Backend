const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const db = require('../../../db/models');
const User = db.User;
const Role = db.Role;
const UserVerificationLinks = db.UserVerificationLinks;
const bcrypt = require('bcrypt');
const moment = require('moment');
var jwt = require('jsonwebtoken');
const { status, removeImage, common, dbCommon, enums } = require('../../../../utils');
const { logger } = require('../../../../utils/lib/logger');

// user login
exports.login = async (req, res) => {
    try {
        const user = await User.scope('withPassword').findOne({
            where: {
                email: req.body.email,
                deletedAt: null,
                // status: '1',
            },
            include: [
                {
                    model: Role,
                    as: 'Role',
                    attributes: ['id', 'name'],
                },
            ],
        });
        if (!user) {
            return res.status(status.NotFound).json({
                message: 'User does not exist.',
            });
        }

        if (user.status != '1') {
            return res.status(status.NotFound).json({
                message: 'You Account has been disabled. Please contact Admin',
            });
        }

        if (!bcrypt.compareSync(req.body.password, user.password)) {
            return res.status(status.NotFound).json({
                message: 'Invalid credentials.',
            });
        }

        const payload = {
            user: {
                id: user.id,
                email: user.email,
                signature: user.password.slice(-16),
            },
        };

        const userData = {
            userName: user.firstName + ' ' + user.lastName,
            email: user.email,
            role: user.Role.name,
            profileImage: user?.profileImage,
            isPasswordChangeRequired: user.isPasswordChangeRequired,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET_ADMIN, {
            expiresIn: req.body.rememberMe ? process.env.TOKEN_EXPIRE_MAX : process.env.TOKEN_EXPIRE_MIN,
        });

        logger.info(
            `LoggedIn User: ${user.firstName + ' ' + user.lastName}, ${user.email}, LoginTime: ${moment(new Date()).format(
                'MMM-DD-YYYY HH:mm:ss'
            )} in IP: ${common.getUserIP(req)}`
        );

        const responseData = {
            message: 'Login Success',
            accessToken: token,
            userData: userData,
        };

        dbCommon.createAuditLog(res.req, res, responseData, 'LOGIN', user.id);

        return res.status(status.OK).json(responseData);
    } catch (err) {
        return common.throwException(err, 'Login User', req, res);
    }
};

exports.verifyToken = (req, res) => {
    try {
        const data = req.user;

        // const decoded = jwt.verify(req?.headers?.authorization, process.env.JWT_SECRET_ADMIN, function (err, decoded) {
        //     if (err) {
        //         return null;
        //     }
        //     return decoded;
        // });

        // const payload = {
        // 	user: {
        // 		id: data.id,
        // 		email: data.email,
        // 		signature: data.password.slice(-16),
        // 	},
        // };

        const userData = {
            userName: data.firstName + ' ' + data.lastName,
            email: data.email,
            role: data.Role.name,
            profileImage: data?.profileImage,
            isPasswordChangeRequired: data.isPasswordChangeRequired,
        };

        // const token = jwt.sign({ ...payload, exp: decoded?.exp || process.env.TOKEN_EXPIRE_MIN }, process.env.JWT_SECRET_ADMIN);

        return res.status(status.OK).json({
            message: 'Token Verified',
            // accessToken: token,
            userData: userData,
        });
    } catch (err) {
        return common.throwException(err, 'Verify Token', req, res);
    }
};

// create user
exports.create = async (req, res) => {
    try {
        const userData = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            mobile: req.body.mobile,
            email: req.body.email.toLowerCase(),
            password: req.body.password,
            roleId: req.body.roleId,
            status: '1',
            isPasswordChangeRequired: true,
            createdBy: req.user.id,
        };

        if (req?.file) {
            userData.profileImage = req?.file?.path;
        }
        await User.create(userData);
        return res.status(status.OK).json({ message: 'User Created Successfully.' });
    } catch (err) {
        removeImage(req?.file?.path);
        return common.throwException(err, 'Create User', req, res);
    }
};

// find user by id
exports.findById = async (req, res) => {
    try {
        var whereCondition = {};
        if (!req.user.Role.isSystemAdmin) {
            whereCondition.isAdmin = false;
            whereCondition.level = { [Op.gt]: req.user.Role.level };
        }

        const user = await User.findOne({
            where: {
                id: req.params.id,
                deletedAt: null,
            },
            include: [
                {
                    model: Role,
                    as: 'Role',
                    attributes: ['id', 'name'],
                    where: {
                        isSystemAdmin: false,
                        ...whereCondition,
                    },
                },
                {
                    model: User,
                    as: 'CreatedByUser',
                    attributes: ['id', 'firstName', 'lastName', 'fullName'],
                },
                {
                    model: User,
                    as: 'UpdatedByUser',
                    attributes: ['id', 'firstName', 'lastName', 'fullName'],
                },
            ],
        });
        if (!user) {
            return res.status(status.NotFound).json({ message: 'User not found.' });
        }
        return res.status(status.OK).json({ data: user });
    } catch (err) {
        return common.throwException(err, 'Get User By Id', req, res);
    }
};

// find user by token
exports.findByToken = async (req, res) => {
    try {
        const user = await User.findOne({
            attributes: {
                exclude: ['password', 'createdBy', 'updatedBy', 'deletedBy', 'deletedAt'],
            },
            where: {
                id: req.user.id,
                deletedAt: null,
            },
            include: [
                {
                    model: Role,
                    as: 'Role',
                    attributes: ['id', 'name'],
                },
            ],
        });
        if (!user) {
            return res.status(status.NotFound).json({ message: 'User not found.' });
        }
        return res.status(status.OK).json({ data: user });
    } catch (err) {
        return common.throwException(err, 'Get User By Token', req, res);
    }
};

// find all user
exports.findAll = async (req, res) => {
    try {
        var whereCondition = {};
        if (!req.user.Role.isSystemAdmin) {
            whereCondition.isAdmin = false;
            whereCondition.level = { [Op.gt]: req.user.Role.level };
        }

        const user = await User.findAll({
            where: {
                deletedAt: null,
            },
            include: [
                {
                    model: Role,
                    as: 'Role',
                    attributes: ['id', 'name'],
                    where: {
                        isSystemAdmin: false,
                        ...whereCondition,
                    },
                },
                {
                    model: User,
                    as: 'CreatedByUser',
                    attributes: ['id', 'firstName', 'lastName', 'fullName'],
                },
                {
                    model: User,
                    as: 'UpdatedByUser',
                    attributes: ['id', 'firstName', 'lastName', 'fullName'],
                },
            ],
            order: [['createdAt', 'DESC']],
        });
        return res.status(status.OK).json({ data: user });
    } catch (err) {
        return common.throwException(err, 'Get User', req, res);
    }
};

// update user
exports.update = async (req, res) => {
    try {
        const userData = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            mobile: req.body.mobile,
            email: req.body.email.toLowerCase(),
            roleId: req.body.roleId,
        };

        if (req?.file) userData.profileImage = req?.file?.path;

        var whereCondition = {};
        if (!req.user.Role.isSystemAdmin) {
            whereCondition.isAdmin = false;
            whereCondition.level = { [Op.gt]: req.user.Role.level };
        }
        const user = await User.findOne({
            where: {
                deletedAt: null,
                id: req.params.id,
            },
            include: [
                {
                    model: Role,
                    as: 'Role',
                    attributes: ['id', 'name'],
                    where: {
                        isSystemAdmin: false,
                        ...whereCondition,
                    },
                },
            ],
        });

        if (!user) {
            return res.status(status.NotFound).json({ message: 'User not found.' });
        }

        let oldImage = user?.profileImage;

        user.set(userData);
        await user.save();

        if (req?.file?.path) removeImage(oldImage);
        return res.status(status.OK).json({
            message: 'User updated successfully.',
        });
    } catch (err) {
        removeImage(req?.file?.path);
        return common.throwException(err, 'Update User', req, res);
    }
};

// update profile
exports.updateProfile = async (req, res) => {
    try {
        const formData = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            mobile: req.body.mobile,
            // email: req.body.email.toLowerCase(),
        };

        if (req?.file) {
            formData.profileImage = req?.file?.path;
        }
        const oldImage = req.user?.profileImage;
        req.user.set(formData);
        await req.user.save();

        const userData = {
            userName: req.user.firstName + ' ' + req.user.lastName,
            // email: req.user.email,
            role: req.user.Role.name,
            profileImage: req.user?.profileImage,
        };

        if (req?.file?.path) removeImage(oldImage);

        return res.status(status.OK).json({
            message: 'Profile updated successfully.',
            userData: userData,
        });
    } catch (err) {
        removeImage(req?.file?.path);
        return common.throwException(err, 'Update User Profile', req, res);
    }
};

// update password by token
exports.updatePassword = async (req, res) => {
    try {
        // var changePassword = {};
        // if (req.route.path == '/profile/first-password-change') {
        //     changePassword.isPasswordChangeRequired = false;
        // }

        const decoded = jwt.verify(req?.headers?.authorization, process.env.JWT_SECRET_ADMIN);

        if (!bcrypt.compareSync(req.body.oldPassword, req.user.password)) {
            return res.status(status.BadRequest).json({
                message: 'Incorrect Old Password',
            });
        }

        if (bcrypt.compareSync(req.body.newPassword, req.user.password)) {
            return res.status(status.BadRequest).json({
                message: 'New Password cannot be same as Old Password credentials.',
            });
        }

        if (!(req.body.newPassword === req.body.confirmPassword)) {
            return res.status(status.BadRequest).json({
                message: 'New Password and Confirm Password do not match.',
            });
        }

        req.user.set({
            password: req.body.newPassword,
            updatedBy: req.user.id,
            isPasswordChangeRequired: false,
        });

        const payload = {
            user: {
                id: req.user.id,
                email: req.user.email,
                signature: req.user.password.slice(-16),
            },
        };

        const token = jwt.sign({ ...payload, exp: decoded?.exp || process.env.TOKEN_EXPIRE_MIN }, process.env.JWT_SECRET_ADMIN);

        await req.user.save();

        return res.status(status.OK).json({
            message: 'Password updated successfully.',
            accessToken: token,
        });
    } catch (err) {
        return common.throwException(err, 'Update User Password', req, res);
    }
};

//  User Password Reset Api
exports.updateUserPassword = async (req, res) => {
    try {
        var changePassword = {};
        if (req.body.isPasswordChangeRequired) {
            changePassword.isPasswordChangeRequired = true;
        }

        const user = await User.findOne({
            where: {
                deletedAt: null,
                id: req.params.id,
            },
        });

        if (!user) {
            return res.status(status.NotFound).json({ message: 'User not found.' });
        }

        const newUser = JSON.parse(JSON.stringify(user));

        if (bcrypt.compareSync(req.body.newPassword, newUser.password)) {
            return res.status(status.BadRequest).json({
                message: 'New Password cannot be same as Old Password credentials.',
            });
        }

        if (!(req.body.newPassword === req.body.confirmPassword)) {
            return res.status(status.BadRequest).json({
                message: 'New Password and Confirm Password do not match.',
            });
        }

        user.set({
            password: req.body.newPassword,
            updatedBy: newUser.id,
            ...changePassword,
        });

        await user.save();
        if (req.body.sendEmail) {
            // const template = await common.getTemplateByName('mail-password.html');
            // const htmlToSend = template({
            //     fullName: newUser?.firstName + ' ' + newUser?.lastName,
            //     password: req.body.newPassword,
            // });
            // const mailOptions = {
            //     to: newUser?.email?.toLowerCase(),
            //     cc: req.user.email,
            //     subject: 'Password Send',
            //     html: htmlToSend,
            // };
            // await common.sendEmail(mailOptions);
        }

        return res.status(status.OK).json({
            message: 'Password updated successfully.',
        });
    } catch (err) {
        return common.throwException(err, 'Update User Password', req, res);
    }
};

// update user status
exports.updateStatus = async (req, res) => {
    try {
        var whereCondition = {};
        if (!req.user.Role.isSystemAdmin) {
            whereCondition.isAdmin = false;
            whereCondition.level = { [Op.gt]: req.user.Role.level };
        }
        const user = await User.findOne({
            where: {
                id: req.params.id,
                deletedAt: null,
            },
            include: [
                {
                    model: Role,
                    as: 'Role',
                    attributes: ['id', 'name'],
                    where: {
                        isSystemAdmin: false,
                        ...whereCondition,
                    },
                },
            ],
        });

        if (!user) {
            return res.status(status.InternalServerError).json({ message: 'User not found.' });
        }

        user.set({
            status: user.status === enums.Status.Active.value ? enums.Status.Inactive.value : enums.Status.Active.value,
            updatedBy: req.user.id,
        });

        await user.save();

        return res.status(status.OK).json({
            message: 'Status updated successfully.',
        });
    } catch (err) {
        return common.throwException(err, 'Update User Status', req, res);
    }
};

// delete user
exports.delete = async (req, res) => {
    try {
        var whereCondition = {};
        if (!req.user.Role.isSystemAdmin) {
            whereCondition.isAdmin = false;
            whereCondition.level = { [Op.gt]: req.user.Role.level };
        }
        const user = await User.findOne({
            where: {
                deletedAt: null,
                [Op.and]: [
                    { id: req.params.id },
                    {
                        id: {
                            [Op.ne]: req.user.id,
                        },
                    },
                ],
            },
            include: [
                {
                    model: Role,
                    as: 'Role',
                    attributes: ['id', 'name'],
                    where: {
                        isSystemAdmin: false,
                        ...whereCondition,
                    },
                },
            ],
        });
        if (!user) {
            return res.status(status.NotFound).json({ message: 'User not found.' });
        }

        user.set({
            status: enums.Status.Inactive.value,
            deletedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
            deletedBy: req.user.id,
        });

        await user.save();

        return res.status(status.OK).json({
            message: 'User deleted successfully.',
        });
    } catch (err) {
        return common.throwException(err, 'Delete User', req, res);
    }
};

// update profile image
exports.removeProfileImage = async (req, res) => {
    try {
        const oldImage = req.user?.profileImage;

        req.user.set({ profileImage: null });
        await req.user.save();
        const userData = {
            userName: req.user.firstName + ' ' + req.user.lastName,
            email: req.user.email,
            role: req.user.Role.name,
            profileImage: null,
        };
        removeImage(oldImage);
        return res.status(status.OK).json({
            message: 'Profile Image removed.',
            userData: userData,
        });
    } catch (err) {
        return common.throwException(err, 'Remove User Profile', req, res);
    }
};

// SEVE => Send Email Verification Link
exports.SEVL = async (req, res) => {
    try {
        if (req.user && req?.user?.isEmailVerified === '0') {
            const payload = {
                user: {
                    id: req?.user?.id,
                    email: req?.user?.email?.toLowerCase(),
                    signature: req?.user?.password?.slice(-16),
                },
            };
            const token = jwt.sign(payload, process.env.JWT_SECRET_ADMIN, {
                expiresIn: '10m',
            });

            // var tempApiUrl = process.env.FRONTEND_URL + `/email-verify?token=${token}`;

            // const template = await common.getTemplateByName('mail-verify-email.html');

            // const htmlToSend = template({
            //     fullName: req?.user?.firstName + ' ' + req?.user?.lastName,
            //     frontendURL: tempApiUrl,
            // });

            // const mailOptions = {
            //     to: req?.user?.email?.toLowerCase(),
            //     subject: 'Email Verification',
            //     html: htmlToSend,
            // };

            // await common.sendEmail(mailOptions);

            let tokenData = {
                token: token.slice(token.length - 64, token.length),
                userId: req.user.id,
            };

            await UserVerificationLinks.create(tokenData);

            return res.status(status.OK).send({ message: 'Email verification link sent!' });
        } else {
            return res.status(status.NotAcceptable).send({ message: 'Email Already Verified!' });
        }
    } catch (err) {
        return common.throwException(err, 'Send Email Verification Link', req, res);
    }
};

exports.validateEmail = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        let token = req?.query?.token;
        if (!token) {
            await transaction.rollback();
            return res.status(status.Unauthorized).send({ message: 'Link expired please generate new link.' });
        }

        let decoded = jwt.verify(token, process.env.JWT_SECRET_ADMIN, function (err, decoded) {
            if (err) {
                return null;
            }
            return decoded;
        });
        if (!decoded) {
            await transaction.rollback();
            return res.status(status.Unauthorized).send({ message: 'Link expired please generate new link.' });
        }

        let verificationLink = await UserVerificationLinks.findOne({
            where: {
                userId: decoded?.user?.id,
                token: token.slice(token.length - 64, token.length),
                deletedAt: null,
                status: '1',
            },
        });

        if (!verificationLink) {
            await transaction.rollback();
            return res.status(status.Unauthorized).send({ message: 'Link expired please generate new link.' });
        }

        var dbUser = await User.findOne({
            where: {
                id: decoded?.user?.id,
                deletedAt: null,
                status: '1',
            },
            transaction,
        });

        if (!dbUser) {
            return res.status(status.NotFound).send({ message: 'User does not exists.' });
        }

        if (dbUser?.isEmailVerified === '1') {
            return res.status(status.NotAcceptable).send({ message: 'Email already verified.' });
        }

        dbUser.set({
            isEmailVerified: '1',
        });
        await dbUser.save({ transaction });

        verificationLink.set({
            status: enums.Status.Inactive.value,
            deletedAt: db.sequelize.literal('CURRENT_TIMESTAMP'),
        });
        await verificationLink.save({ transaction });

        await transaction.commit();
        return res.status(status.OK).send({ message: 'Email successfully verified' });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Email Verify', req, res);
    }
};

exports.validateToken = async (req, res) => {
    let token = req?.query?.token;

    if (!token) {
        return res.status(status.Unauthorized).send({ message: 'Link expired please generate new link' });
    }

    try {
        let decoded = jwt.verify(token, process.env.JWT_SECRET_ADMIN, function (err, decoded) {
            if (err) {
                return null;
            }
            return decoded;
        });

        if (!decoded) {
            return res.status(status.Unauthorized).send({ message: 'Link expired please generate new link' });
        }

        let tokenData = await UserVerificationLinks.findOne({
            where: {
                userId: decoded.id || decoded.user.id,
                token: token.slice(token.length - 64, token.length),
                deletedAt: null,
                status: '1',
            },
        });

        if (!tokenData) {
            return res.status(status.Unauthorized).send({ message: 'Link expired please generate new link' });
        }
        return res.status(status.OK).send({ message: 'Token verified successfully' });
    } catch (err) {
        return common.throwException(err, 'Validate Token', req, res, 'Your session has expired!!');
    }
};

// Send Email Verification Link Forget Password
exports.SEVLFP = async (req, res) => {
    try {
        const dbUser = await User.findOne({
            where: {
                email: req.body.email,
            },
        });

        if (!dbUser) {
            return res.status(status.Unauthorized).send({ message: 'User account not found!' });
        }

        const user = {
            id: dbUser?.id,
            email: dbUser?.email,
            signature: dbUser?.password?.slice(-16),
        };
        const token = jwt.sign(user, process.env.JWT_SECRET_ADMIN, {
            expiresIn: '10m',
        });

        // let tempApiUrl = process.env.FRONTEND_URL + '/reset-password/' + token;
        // let tempApiUrl = process.env.FRONTEND_URL + `/reset-password?token=${token}`;

        // const template = await common.getTemplateByName('mail-reset-password.html');

        // const htmlToSend = template({
        //     fullName: dbUser?.firstName + ' ' + dbUser?.lastName,
        //     frontendURL: tempApiUrl,
        // });

        // const mailOptions = {
        //     to: dbUser?.email?.toLowerCase(),
        //     subject: 'Forgot Password Link',
        //     html: htmlToSend,
        // };

        // await common.sendEmail(mailOptions);

        let tokenData = {
            token: token.slice(token.length - 64, token.length),
            userId: dbUser?.id,
        };
        await UserVerificationLinks.create(tokenData);

        return res.status(status.OK).send({
            message: 'Verification mail sent Successfully',
        });
    } catch (err) {
        return common.throwException(err, 'verify email', req, res, 'Something Went Wrong While Verification mail could not send');
    }
};

// reset user password
exports.resetPassword = async (req, res) => {
    let token = req?.query?.token;
    const transaction = await db.sequelize.transaction();
    try {
        if (!token) {
            await transaction.rollback();
            return res.status(status.Unauthorized).send({ message: 'Link expired please generate new link' });
        }

        let decoded = jwt.verify(token, process.env.JWT_SECRET_ADMIN, function (err, decoded) {
            if (err) {
                return null;
            }
            return decoded;
        });

        if (!decoded) {
            await transaction.rollback();
            return res.status(status.Unauthorized).send({ message: 'Link expired please generate new link.' });
        }

        let verificationLink = await UserVerificationLinks.findOne({
            where: {
                userId: decoded.id,
                token: token.slice(token.length - 64, token.length),
                deletedAt: null,
                status: '1',
            },
        });

        if (!verificationLink) {
            await transaction.rollback();
            return res.status(status.Unauthorized).send({ message: 'Link expired please generate new link.' });
        }

        var dbUser = await User.findOne({
            where: { id: decoded.id, deletedAt: null, status: '1' },
            transaction,
        });
        if (!dbUser) {
            await transaction.rollback();
            return res.status(status.Unauthorized).send({ message: 'User does not exists.' });
        }

        dbUser.set({
            password: req.body.newPassword,
        });
        await dbUser.save({ transaction });

        verificationLink.set({
            status: enums.Status.Inactive.value,
            deletedAt: db.sequelize.literal('CURRENT_TIMESTAMP'),
        });
        await verificationLink.save({ transaction });

        await transaction.commit();
        return res.status(status.OK).send({ message: 'Password reset success.' });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Password reset', req, res);
    }
};

// user wise login
exports.mockUserLogin = async (req, res) => {
    try {
        const user = await User.scope('withPassword').findOne({
            where: {
                id: req.params.id,
                deletedAt: null,
                // status: '1',
            },
            include: [
                {
                    model: Role,
                    as: 'Role',
                    attributes: ['id', 'name'],
                },
            ],
        });
        if (!user) {
            return res.status(status.NotFound).json({
                message: 'User does not exist.',
            });
        }

        if (user.status != '1') {
            return res.status(status.NotFound).json({
                message: 'You Account has been disabled. Please contact Admin',
            });
        }

        const payload = {
            user: {
                id: user.id,
                email: user.email,
                signature: user.password.slice(-16),
                isMockToken: true,
            },
        };

        const userData = {
            userName: user.firstName + ' ' + user.lastName,
            email: user.email,
            role: user.Role.name,
            profileImage: user?.profileImage,
            isPasswordChangeRequired: user.isPasswordChangeRequired,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET_ADMIN, {
            expiresIn: process.env.TOKEN_EXPIRE_MIN,
        });

        return res.status(status.OK).json({
            message: 'Login Success',
            accessToken: token,
            userData: userData,
        });
    } catch (err) {
        return common.throwException(err, 'Login User', req, res);
    }
};
