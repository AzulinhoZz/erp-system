'use strict';

const { body } = require('express-validator');

const createValidators = [
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  body('branchId').isMongoId().withMessage('branchId must be a valid id'),
  body('location').optional().isString(),
];

const updateValidators = [
  body('name').optional().isString().trim().notEmpty(),
  body('location').optional().isString(),
];

module.exports = { createValidators, updateValidators };
