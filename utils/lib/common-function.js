const { validationResult } = require('express-validator');
const { status } = require('./messages/api.response');
const { logger } = require('./logger');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const errorStackParser = require('error-stack-parser');
const fs = require('fs');
const path = require('path');
const UAParser = require('ua-parser-js');

// const AuditLogs = db.AuditLogs;

module.exports = {
    getUserIP(req) {
        var clientIP = req.ip || req.socket.remoteAddress;
        return clientIP.includes('::ffff:') ? clientIP.split('::ffff:')[1] : clientIP;
    },
    expressValidate(req, res, next) {
        const errors = validationResult(req);
        let errorSort = errors.array({
            onlyFirstError: true,
        });

        if (!errors.isEmpty()) {
            // eslint-disable-next-line no-unused-vars
            let error = errorSort[0];
            return res.status(status.BadRequest).json({ message: 'Validation Error', fields: errorSort });
        }
        next();
    },

    async addDaysSetHours(days, date = new Date(), hours = null, minutes = null, seconds = null) {
        var result = new Date(date);
        result.setDate(result.getDate() + days);
        if (hours != null) result.setHours(hours);
        if (minutes != null) result.setHours(hours, minutes);
        if (seconds != null) result.setHours(hours, minutes, seconds);
        return result;
    },

    /**
     *
     * @param {*} mailOptions email, subject, message required
     * @returns
     */
    async sendEmail(mailOptions) {
        try {
            mailOptions.from = process.env.MailAuthEmail;
            const transporter = nodemailer.createTransport({
                host: process.env.MailHost,
                port: process.env.MailPort,
                auth: {
                    user: process.env.MailAuthUser,
                    pass: process.env.MailAuthPassword,
                },
            });

            await transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            this.throwException(error, 'Common Send Mail Function', null, null, null);
            return Promise.reject(error);
        }
    },

    async getTemplateByName(name) {
        var html = fs.readFileSync(path.join(__dirname, '../templates/html/', name), 'utf8');
        const template = handlebars.compile(JSON.parse(JSON.stringify(html)));
        return template;
    },

    /**
     *
     * @param {*} error Error Object.
     * @param {*} APIName - API/Function name where error occurred - will be used if REQ is not available.
     * @param {*} req Request Object (optional).
     * @param {*} res Response Object (optional).
     * @param {*} customMessage Any custom message to send in API response. (optional)
     * @returns return response to client with message.
     */
    throwException(error, APIName, req = null, res = null, customMessage = null) {
        if (Object.prototype.hasOwnProperty.call(error, 'errors')) {
            console.log('multiple errors');
            error.message = error.errors[0].message || error.name;
        }

        if (req) {
            console.error(`Error in ${APIName}, URL: ${req.method} - ${req.url}:`, error.message);
            logger.error(
                `Error in ${APIName}, URL: ${req.method} - ${req.url}: "${error.message}", User: ${
                    req.user ? req.user.firstName + ' ' + req.user.lastName : 'Open API'
                },  IP: ${req.ip} - at ${errorStackParser.parse(error)[0].toString()}`
            );
        } else {
            console.error(`Error in ${APIName},`, error.message);
            logger.error(`Error in ${APIName}, "${error.message}" at ${errorStackParser.parse(error)[0].toString()}`);
        }

        if (res) {
            return res.status(status.InternalServerError).json({
                message: customMessage ? customMessage : 'Something went wrong, please try again!',
                error: error.message,
            });
        } else {
            return true;
        }
    },

    getParsedUA(ua) {
        // UA parser
        let parser = new UAParser(ua);
        let parserResult = parser.getResult();

        const userAgent = parserResult.ua;

        // Client OS
        const os = parserResult.os.name + ' ' + parserResult.os.version;

        // Client Browser
        const browser = parserResult.browser.name + '/' + parserResult.browser.version;

        return { os, browser, userAgent };
    },

    // // audit logs
    // async auditLogs(action, tableName, createdBy, routerIpAddress, localIpAddress, deviceName, operatingSystem, browser, userAgent) {
    //     try {
    //         await AuditLogs.create({
    //             actionType: action,
    //             tableName: tableName,
    //             createdBy: createdBy,
    //             routerIpAddress: routerIpAddress,
    //             localIpAddress: localIpAddress,
    //             deviceName: deviceName,
    //             operatingSystem: operatingSystem,
    //             browser: browser,
    //             userAgent: userAgent,
    //         });
    //     } catch (err) {
    //         console.log('eeeee', err);
    //         // this.throwException(err, 'Audit logs Create', null, null, null);
    //     }
    // },
};
