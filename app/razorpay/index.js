const router = require('express').Router();
const controller = require('./lib/controller');

router.post('/razorpay-webhooks', controller.webhookHandler);

module.exports = router;
