const { body } = require('express-validator');

const createCheckout = () => {
    return [
        body('productId').notEmpty().trim().withMessage('Product Id is required'),
        body('quantity').notEmpty().trim().withMessage('Quantity is required'),
    ];
};

module.exports = {
    createCheckout,
};
