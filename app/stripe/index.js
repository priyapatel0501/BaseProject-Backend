const express = require('express');
const router = express.Router();
const controller = require('./lib/controller');

router.post('/stripe-webhook', express.raw({ type: 'application/json' }), controller.webhookHandler);

module.exports = router;
