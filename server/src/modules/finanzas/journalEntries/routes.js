'use strict';

const router = require('express').Router();
const controller = require('./controller');
const { authenticate } = require('../../../middlewares/auth');
const { authorize } = require('../../../middlewares/rbac');
const { validate } = require('../../../middlewares/validate');
const { createValidators, listValidators } = require('./validators');
const { PERMISSIONS } = require('@erp/shared');

router.use(authenticate);

router.get(
  '/',
  listValidators,
  validate,
  authorize(PERMISSIONS.JOURNAL_ENTRIES_READ),
  controller.list
);
router.post(
  '/',
  createValidators,
  validate,
  authorize(PERMISSIONS.JOURNAL_ENTRIES_WRITE),
  controller.create
);

module.exports = router;
