const { body } = require('express-validator');

const validationRules = () => {
    return [body('parentId').notEmpty().trim().withMessage('Parent is required.')];
};

module.exports = {
    validationRules,
};
