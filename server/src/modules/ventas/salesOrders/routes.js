'use strict';

const router = require('express').Router();
const controller = require('./controller');
const { authenticate } = require('../../../middlewares/auth');
const { authorize } = require('../../../middlewares/rbac');
const { validate } = require('../../../middlewares/validate');
const { createValidators, confirmValidators, listValidators } = require('./validators');
const { PERMISSIONS } = require('@erp/shared');

router.use(authenticate);

router.get('/', listValidators, validate, authorize(PERMISSIONS.SALES_ORDERS_READ), controller.list);
router.get('/:id', authorize(PERMISSIONS.SALES_ORDERS_READ), controller.getById);
router.post(
  '/',
  createValidators,
  validate,
  authorize(PERMISSIONS.SALES_ORDERS_WRITE),
  controller.create
);
router.post(
  '/:id/confirm',
  confirmValidators,
  validate,
  authorize(PERMISSIONS.SALES_ORDERS_WRITE),
  controller.confirm
);

module.exports = router;
