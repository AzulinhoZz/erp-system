'use strict';

const { body } = require('express-validator');

const createValidators = [
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  body('taxId').isString().trim().notEmpty().withMessage('taxId is required'),
  body('settings').optional().isObject(),
];

const updateValidators = [
  body('name').optional().isString().trim().notEmpty(),
  body('taxId').optional().isString().trim().notEmpty(),
  body('settings').optional().isObject(),
];

module.exports = { createValidators, updateValidators };
