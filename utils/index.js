module.exports = {
    modules: require('./lib/modules'),
    messages: require('./lib/messages/api.response').messages,
    status: require('./lib/messages/api.response').status,
    // sendGrid: require('./lib/sendGrid').sendMail,
    mailTemplate: require('./lib/sendGrid').mailTemplate,
    removeImage: require('./lib/removeImage').removeImage,
    // razorpayInstance: require('./lib/razorpay').instance,
    // stripeInstance: require('./lib/stripe').instance,
    common: require('./lib/common-function'),
    dbCommon: require('./lib/db-common-function'),
    logger: require('./lib/logger').logger,
    enums: require('./lib/enums'),
};
