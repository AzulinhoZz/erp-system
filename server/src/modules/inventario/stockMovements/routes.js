'use strict';

const router = require('express').Router();
const controller = require('./controller');
const { authenticate } = require('../../../middlewares/auth');
const { authorize } = require('../../../middlewares/rbac');
const { validate } = require('../../../middlewares/validate');
const { createValidators, listValidators } = require('./validators');
const { body } = require('express-validator');
const { PERMISSIONS } = require('@erp/shared');

router.use(authenticate);

router.get('/', listValidators, validate, authorize(PERMISSIONS.STOCK_READ), controller.list);
router.post('/', createValidators, validate, authorize(PERMISSIONS.STOCK_WRITE), controller.create);
router.post(
  '/:id/reverse',
  body('reason').optional().isString().trim().isLength({ max: 500 }),
  validate,
  authorize(PERMISSIONS.STOCK_WRITE),
  controller.reverse
);

module.exports = router;
