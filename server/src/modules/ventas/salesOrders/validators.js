'use strict';

const { body, query, param } = require('express-validator');
const { isDecimalString } = require('../../../middlewares/validate');

const itemsValidators = [
  body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array'),
  body('items.*.productId').isMongoId().withMessage('each item needs a valid productId'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('each item needs quantity >= 1'),
  body('items.*.unitPrice')
    .custom(isDecimalString)
    .withMessage('each item needs unitPrice as decimal string'),
];

const createValidators = [
  body('customerId').isMongoId().withMessage('customerId must be a valid id'),
  ...itemsValidators,
  body('date').optional().isISO8601(),
  body('warehouseId').optional().isMongoId(),
  body('companyId').optional().isMongoId(),
];

const confirmValidators = [
  param('id').isMongoId(),
  body('warehouseId').optional().isMongoId(),
];

const listValidators = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isString(),
];

module.exports = { createValidators, confirmValidators, listValidators };
