var jwt = require('jsonwebtoken');
const db = require('../db/models');
const { status, dbCommon, common } = require('../../utils');
const User = db.User;
const Role = db.Role;
const { getNamespace } = require('cls-hooked');

const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../../app/db/audit-logger/config.json')[env];

const authenticateUser = async (req, res, next) => {
    try {
        var token = req.headers.authorization || null;
        if (!token) {
            return res.status(status.Unauthorized).json({ message: 'Unauthorized access.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_ADMIN);

        if (!decoded) {
            return res.status(status.Unauthorized).json({ message: 'Unauthorized access.' });
        }
        const user = await User.scope('withPassword').findOne({
            attributes: {
                exclude: ['createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'deletedAt', 'deletedBy'],
            },
            where: { id: decoded.user.id, deletedAt: null, status: '1' },
            include: [
                {
                    model: Role,
                    as: 'Role',
                    attributes: ['id', 'name', 'isSystemAdmin', 'isAdmin', 'level'],
                    where: {
                        status: '1',
                        deletedAt: null,
                    },
                },
            ],
        });
        if (!user) {
            return res.status(status.Unauthorized).json({
                message: 'Unauthorized access.',
            });
        }
        if (decoded?.user?.signature != user.password.slice(-16)) {
            return res.status(status.Unauthorized).json({
                message: 'Unauthorized access.',
            });
        }

        // Add the current user instance in request.
        req.user = user;
        let namespace = getNamespace(config.clsNamespace);

        const oldJSONRes = res.json;
        res.json = function (data) {
            // arguments[0] (or `data`) contains the response body
            createResponseLog(res, data);
            return oldJSONRes.apply(res, arguments);
        };

        // initiating the session namespace.
        namespace.run(() => {
            // Adding the current user instance and request details in session context.
            namespace.set(config.clsUser, user.toJSON());
            namespace.set(config.clsUserId, user.id);
            namespace.set(config.clsStartTime, req.startTime);
            namespace.set(config.requestPath, req.originalUrl);
            namespace.set(config.clientIP, common.getUserIP(req));
            namespace.set(config.requestMethod, req.method);
            namespace.set(config.userAgent, req.headers['user-agent']);
            next();
        });
    } catch (err) {
        return res.status(status.Unauthorized).json({ message: 'Unauthorized access.' });
    }
};

async function createResponseLog(res, data) {
    if ((res.req.method === 'GET' || res.statusCode != status.OK) && !res.req.path.endsWith('options')) {
        return await dbCommon.createAuditLog(res.req, res, data, 'VIEW');
    }
}

module.exports = authenticateUser;
