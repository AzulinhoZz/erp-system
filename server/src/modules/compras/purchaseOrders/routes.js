'use strict';

const router = require('express').Router();
const controller = require('./controller');
const { authenticate } = require('../../../middlewares/auth');
const { authorize } = require('../../../middlewares/rbac');
const { validate } = require('../../../middlewares/validate');
const { createValidators, receiveValidators, listValidators } = require('./validators');
const { PERMISSIONS } = require('@erp/shared');

router.use(authenticate);

router.get('/', listValidators, validate, authorize(PERMISSIONS.PURCHASE_ORDERS_READ), controller.list);
router.get('/:id', authorize(PERMISSIONS.PURCHASE_ORDERS_READ), controller.getById);
router.post(
  '/',
  createValidators,
  validate,
  authorize(PERMISSIONS.PURCHASE_ORDERS_WRITE),
  controller.create
);
router.post(
  '/:id/receive',
  receiveValidators,
  validate,
  authorize(PERMISSIONS.PURCHASE_ORDERS_WRITE),
  controller.receive
);

module.exports = router;
