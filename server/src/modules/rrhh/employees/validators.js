'use strict';

const { body, query } = require('express-validator');
const { isDecimalString } = require('../../../middlewares/validate');

const createValidators = [
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  body('position').isString().trim().notEmpty().withMessage('Position is required'),
  body('branchId').isMongoId().withMessage('branchId must be a valid id'),
  body('salary').custom(isDecimalString).withMessage('salary must be a decimal string'),
  body('isActive').optional().isBoolean(),
  body('companyId').optional().isMongoId(),
];

const updateValidators = [
  body('name').optional().isString().trim().notEmpty(),
  body('position').optional().isString().trim().notEmpty(),
  body('branchId').optional().isMongoId(),
  body('salary').optional().custom(isDecimalString),
  body('isActive').optional().isBoolean(),
];

const listValidators = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

module.exports = { createValidators, updateValidators, listValidators };
