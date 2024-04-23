/* eslint-disable no-unused-vars */
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const db = require('../../../db/models');
const User = db.User;
const Role = db.Role;
const axios = require('axios');
const UserVerificationLinks = db.UserVerificationLinks;
const bcrypt = require('bcrypt');
const moment = require('moment');
var jwt = require('jsonwebtoken');
const { status, removeImage, common } = require('../../../../utils');
const { logger } = require('../../../../utils/lib/logger');

const CLIENT_ID = process.env.GCLIENT_ID;
const CLIENT_SECRET = process.env.GCLIENT_SECRET;
const REDIRECT_URI = process.env.GREDIRECT_URI;

exports.loginWithGoogle = async (req, res) => {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=profile email`;
    return res.status(status.OK).redirect(301, url);
};

exports.googleCallback = async (req, res) => {
    const { code } = req.query;

    try {
        const tokenBody = {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code',
        };
        const { data } = await axios.post(process.env.GTOKEN_URL, tokenBody);

        console.error('token data', data);

        const { access_token, id_token } = data;
        console.error('access_token', access_token);
        console.error('id_token', id_token);

        // Use access_token or id_token to fetch user profile
        const { data: profile } = await axios.get(process.env.GPROFILE_URL, {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        // **************************************
        const user = await User.scope('withPassword').findOne({
            where: {
                email: profile.email,
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

        console.error('user', user);
        if (!user) {
            return res.redirect(301, process.env.FRONTEND_LOGIN_URL);
            // return res.status(status.NotFound).json({
            //     message: 'User does not exist.',
            // });
        }

        if (user.status != '1') {
            return res.redirect(301, process.env.FRONTEND_LOGIN_URL);
            // return res.status(status.NotFound).json({
            //     message: 'You Account has been disabled. Please contact Admin',
            // });
        }

        const payload = {
            user: {
                id: user.id,
                email: user.email,
                signature: user.password.slice(-16),
            },
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET_ADMIN, {
            expiresIn: process.env.TOKEN_EXPIRE_MIN,
        });

        console.error('response data', data);
        console.error('response profile', profile);

        const redirectUrl = process.env.FRONTEND_GOOGLE_LOGIN_URL + '/' + token;

        console.error('redirectUrl', redirectUrl);
        // Code to handle user authentication and retrieval using the profile data

        return res.status(status.OK).redirect(301, redirectUrl);
    } catch (err) {
        console.error('Error:', err?.response?.data?.error);
        console.error('errrr', err);
        return res.redirect(301, process.env.FRONTEND_LOGIN_URL);
    }
};
