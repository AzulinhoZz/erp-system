'use strict';

const { body, query } = require('express-validator');
const { ACCOUNT_TYPES } = require('@erp/shared');

const createValidators = [
  body('code').isString().trim().notEmpty().withMessage('code is required'),
  body('name').isString().trim().notEmpty().withMessage('name is required'),
  body('type').isIn(ACCOUNT_TYPES).withMessage(`type must be one of: ${ACCOUNT_TYPES.join(', ')}`),
  body('companyId').optional().isMongoId(),
];

const updateValidators = [
  body('code').optional().isString().trim().notEmpty(),
  body('name').optional().isString().trim().notEmpty(),
  body('type').optional().isIn(ACCOUNT_TYPES),
];

const listValidators = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('type').optional().isIn(ACCOUNT_TYPES),
];

module.exports = { createValidators, updateValidators, listValidators };
