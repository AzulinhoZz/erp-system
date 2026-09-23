'use strict';

const { body, query } = require('express-validator');
const { isDecimalString } = require('../../../middlewares/validate');

const createValidators = [
  body('sku').isString().trim().notEmpty().withMessage('SKU is required'),
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  body('category').optional().isString(),
  body('unit').optional().isString(),
  body('cost').custom(isDecimalString).withMessage('cost must be a positive decimal string'),
  body('price').custom(isDecimalString).withMessage('price must be a positive decimal string'),
  body('stock').optional().isInt({ min: 0 }),
  body('minStock').optional().isInt({ min: 0 }),
  body('companyId').optional().isMongoId(),
];

const updateValidators = [
  body('name').optional().isString().trim().notEmpty(),
  body('category').optional().isString(),
  body('unit').optional().isString(),
  body('cost').optional().custom(isDecimalString),
  body('price').optional().custom(isDecimalString),
  body('minStock').optional().isInt({ min: 0 }),
];

const listValidators = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

module.exports = { createValidators, updateValidators, listValidators };
