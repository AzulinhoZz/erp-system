'use strict';

const router = require('express').Router();
const controller = require('./controller');
const { authenticate } = require('../../../middlewares/auth');
const { validate } = require('../../../middlewares/validate');
const { listValidators, markReadValidators } = require('./validators');

router.use(authenticate);

// Notifications need no extra RBAC permission: every user manages their own.
router.get('/', listValidators, validate, controller.list);
router.put('/read-all', controller.markAllRead);
router.put('/:id/read', markReadValidators, validate, controller.markRead);

module.exports = router;
