'use strict';

const { body } = require('express-validator');

const createValidators = [
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  body('companyId').optional().isMongoId(),
  body('address').optional().isString(),
];

const updateValidators = [
  body('name').optional().isString().trim().notEmpty(),
  body('address').optional().isString(),
];

module.exports = { createValidators, updateValidators };
