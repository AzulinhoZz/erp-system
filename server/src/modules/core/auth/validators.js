'use strict';

const { body } = require('express-validator');

const loginValidators = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

const refreshValidators = [
  body('refreshToken').isString().notEmpty().withMessage('Refresh token is required'),
];

const switchCompanyValidators = [
  body('companyId').isMongoId().withMessage('companyId must be a valid id'),
];

module.exports = { loginValidators, refreshValidators, switchCompanyValidators };
