'use strict';

const router = require('express').Router();
const controller = require('./controller');
const { authenticate } = require('../../../middlewares/auth');
const { authorize } = require('../../../middlewares/rbac');
const { validate } = require('../../../middlewares/validate');
const { listValidators } = require('./validators');
const { PERMISSIONS } = require('@erp/shared');

router.use(authenticate);

// Read-only on purpose: the trail is append-only (no POST/PUT/DELETE here).
router.get('/', listValidators, validate, authorize(PERMISSIONS.AUDIT_READ), controller.list);

module.exports = router;
