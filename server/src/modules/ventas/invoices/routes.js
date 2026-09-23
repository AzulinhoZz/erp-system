'use strict';

const router = require('express').Router();
const controller = require('./controller');
const { authenticate } = require('../../../middlewares/auth');
const { authorize } = require('../../../middlewares/rbac');
const { validate } = require('../../../middlewares/validate');
const { createValidators, updateStatusValidators, listValidators } = require('./validators');
const { PERMISSIONS } = require('@erp/shared');

router.use(authenticate);

router.get('/', listValidators, validate, authorize(PERMISSIONS.INVOICES_READ), controller.list);
router.post(
  '/',
  createValidators,
  validate,
  authorize(PERMISSIONS.INVOICES_WRITE),
  controller.create
);
router.put(
  '/:id/status',
  updateStatusValidators,
  validate,
  authorize(PERMISSIONS.INVOICES_WRITE),
  controller.updateStatus
);

module.exports = router;
