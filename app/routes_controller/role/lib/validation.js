const { body } = require('express-validator');

const validationRules = () => {
    return [body('name').notEmpty().trim().withMessage('Name is required.'), body('description').optional({ nullable: true })];
};
const validationUpdateLevelRules = () => {
    return [
        body('roleIds').notEmpty().withMessage('Role Data is required.').isArray({ min: 1 }).withMessage('Minimum one role is required.'),
        body('roleIds.*').notEmpty().trim().withMessage('RoleIds is required.').isUUID().withMessage('RoleIds must be a valid UUID'),
    ];
};

module.exports = {
    validationRules,
    validationUpdateLevelRules,
};
