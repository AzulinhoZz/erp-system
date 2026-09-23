'use strict';

const { body, query } = require('express-validator');

const createValidators = [
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isString()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('roleId').isMongoId().withMessage('roleId must be a valid id'),
  body('companyId').optional().isMongoId().withMessage('companyId must be a valid id'),
  body('isActive').optional().isBoolean(),
];

const updateValidators = [
  body('name').optional().isString().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  body('password').optional().isString().isLength({ min: 8 }),
  body('roleId').optional().isMongoId(),
  body('isActive').optional().isBoolean(),
];

const listValidators = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('isActive').optional().isBoolean(),
];

module.exports = { createValidators, updateValidators, listValidators };
