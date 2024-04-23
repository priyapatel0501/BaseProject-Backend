const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const authPermission = require('../../middlewares/permission.middleware');
const controller = require('./lib/controller');
const { validationRules, validationUpdateLevelRules } = require('./lib/validation');
const { modules } = require('../../../utils');
const { expressValidate } = require('../../../utils/lib/common-function');

// get all Role
router.get(
    '/role',
    auth,
    authPermission([modules.setup_role_view, modules.setup_role, modules.setup_role_edit, modules.setup_user_add, modules.setup_user_edit]),
    controller.findAll
);

// get all role options
router.get(
    '/role/options',
    auth,
    authPermission([modules.setup_role_view, modules.setup_role, modules.setup_role_edit, modules.setup_user_add, modules.setup_user_edit]),
    controller.findAll
);

// get Role by Id
router.get(
    '/role/:id',
    auth,
    authPermission([modules.setup_role_view, modules.setup_role, modules.setup_role_edit, modules.setup_user_add, modules.setup_user_edit]),
    controller.findById
);

// create Role
router.post('/role', auth, authPermission([modules.setup_role_add]), validationRules(), expressValidate, controller.create);

// update level
router.post(
    '/role/update-level',
    auth,
    authPermission([modules.setup_role_update_hierarchy]),
    validationUpdateLevelRules(),
    expressValidate,
    controller.updateLevel
);

// update Role
router.put('/role/:id', auth, authPermission([modules.setup_role_edit]), validationRules(), expressValidate, controller.update);

// update Role status
router.put('/role/status/:id', auth, authPermission([modules.setup_role_edit]), controller.updateStatus);

// delete Role
router.delete('/role/:id', auth, authPermission([modules.setup_role_delete]), controller.delete);

module.exports = router;
