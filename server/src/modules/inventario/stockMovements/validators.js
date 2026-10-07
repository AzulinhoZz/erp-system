'use strict';

const { body, query } = require('express-validator');
const { STOCK_MOVEMENT_TYPES } = require('@erp/shared');

const createValidators = [
  body('productId').isMongoId().withMessage('productId must be a valid id'),
  body('warehouseId').isMongoId().withMessage('warehouseId must be a valid id'),
  body('type').isIn(STOCK_MOVEMENT_TYPES).withMessage('type must be in/out/adjustment'),
  body('quantity').custom((value, { req }) => {
    const quantity = Number(value);
    if (!Number.isInteger(quantity)) return false;
    return req.body.type === 'adjustment' ? quantity !== 0 : quantity > 0;
  }).withMessage('quantity must be non-zero integer for adjustments and positive for in/out'),
  body('date').optional().isISO8601(),
  body('reference').optional().isString(),
];

const listValidators = [
  query('productId').optional().isMongoId(),
  query('warehouseId').optional().isMongoId(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

module.exports = { createValidators, listValidators };
