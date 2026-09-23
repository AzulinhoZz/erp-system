'use strict';

const { body, query } = require('express-validator');
const { STOCK_MOVEMENT_TYPES } = require('@erp/shared');

const createValidators = [
  body('productId').isMongoId().withMessage('productId must be a valid id'),
  body('warehouseId').isMongoId().withMessage('warehouseId must be a valid id'),
  body('type').isIn(STOCK_MOVEMENT_TYPES).withMessage('type must be in/out'),
  body('quantity').isInt({ min: 1 }).withMessage('quantity must be a positive integer'),
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
