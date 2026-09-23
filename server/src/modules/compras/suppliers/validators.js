'use strict';

const { body, query } = require('express-validator');

const createValidators = [
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  body('taxId').isString().trim().notEmpty().withMessage('taxId is required'),
  body('contact').optional().isString(),
  body('companyId').optional().isMongoId(),
];

const updateValidators = [
  body('name').optional().isString().trim().notEmpty(),
  body('taxId').optional().isString().trim().notEmpty(),
  body('contact').optional().isString(),
];

const listValidators = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

module.exports = { createValidators, updateValidators, listValidators };
