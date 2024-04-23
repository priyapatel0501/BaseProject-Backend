const router = require('express').Router();

router.use('/', require('./user'));
router.use('/', require('./role'));
router.use('/', require('./module_master'));
router.use('/', require('./permission'));
router.use('/', require('./google-apis'));

module.exports = router;
