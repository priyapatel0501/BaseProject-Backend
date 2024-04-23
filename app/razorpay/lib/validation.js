const { body } = require('express-validator');

const createOrder = () => {
    return [body('amount').notEmpty().trim().withMessage('Amount is required.')];
};

const orderSuccess = () => {
    return [
        body('orderId').notEmpty().trim().withMessage('Order Id is required.'),
        body('paymentId').notEmpty().trim().withMessage('Payment Id is required.'),
        body('signature').notEmpty().trim().withMessage('Signature is required.'),
    ];
};

const orderFailed = () => {
    return [
        body('orderId').notEmpty().trim().withMessage('Order Id is required.'),
        body('failedReason').notEmpty().trim().withMessage('Failed Reason is required.'),
    ];
};

module.exports = {
    createOrder,
    orderSuccess,
    orderFailed,
};
