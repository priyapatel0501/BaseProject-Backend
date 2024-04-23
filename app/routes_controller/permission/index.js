const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const controller = require('./lib/controller');
const authPermission = require('../../middlewares/permission.middleware');
const { modules } = require('../../../utils/');

// get User Permissions by token
router.get('/permission', auth, controller.findByToken);

// get User Permissions by Id
router.get('/permission/:id', auth, authPermission([modules.setup_role_assign_permission]), controller.findByRoleId);

// add permission
router.post('/permission/:id', auth, authPermission([modules.setup_role_assign_permission]), controller.create);

module.exports = router;
