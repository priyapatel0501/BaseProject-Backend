const router = require('express').Router();
const controller = require('./lib/controller');

// redirect URL for google login
router.get('/auth/google', controller.loginWithGoogle);

// callback api for google login
router.get('/google/callback', controller.googleCallback);

module.exports = router;
