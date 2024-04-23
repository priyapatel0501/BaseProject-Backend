const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const controller = require('./lib/controller');
const authPermission = require('../../middlewares/permission.middleware');

const { modules } = require('../../../utils/');
const { validationRules } = require('./lib/validation');
const { expressValidate } = require('../../../utils/lib/common-function');

// get all Module
router.get('/module', auth, authPermission([modules.setup_role_assign_permission]), controller.findAll);

// get module by id
router.get('/module/:id', auth, authPermission([modules.setup_role_assign_permission]), controller.findOne);

// create Module
router.post('/module', auth, authPermission(['0']), controller.create);

// update Module
router.put('/module/:id', auth, authPermission(['0']), controller.update);

// update Module status
router.put('/module/status/:id', auth, authPermission(['0']), controller.updateStatus);

// update Module parent
router.put('/module/update-parent/:id', auth, validationRules(), expressValidate, authPermission(['0']), controller.updateParent);

// delete Module
router.delete('/module/:id', auth, authPermission(['0']), controller.delete);

module.exports = router;
