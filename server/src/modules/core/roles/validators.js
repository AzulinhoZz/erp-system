'use strict';

const { body } = require('express-validator');

const createValidators = [
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  body('permissions').isArray().withMessage('permissions must be an array'),
  body('permissions.*').isString().notEmpty().withMessage('Each permission must be a non-empty string'),
];

const updateValidators = [
  body('name').optional().isString().trim().notEmpty(),
  body('permissions').optional().isArray(),
  body('permissions.*').optional().isString(),
];

module.exports = { createValidators, updateValidators };
