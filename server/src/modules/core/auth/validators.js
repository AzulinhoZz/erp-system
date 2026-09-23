'use strict';

const { body } = require('express-validator');

const loginValidators = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

const refreshValidators = [
  body('refreshToken').isString().notEmpty().withMessage('Refresh token is required'),
];

module.exports = { loginValidators, refreshValidators };
