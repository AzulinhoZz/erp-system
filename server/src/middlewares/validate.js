'use strict';

const { validationResult } = require('express-validator');
const { ApiError } = require('./errorHandler');

/** Runs express-validator chains and throws a 400 with field details. */
function validate(req, _res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const details = {};
  for (const err of errors.array()) {
    details[err.path] = err.msg;
  }
  next(new ApiError(400, 'Validation failed', details));
}

/**
 * Money custom validator: monetary values travel as decimal STRINGS
 * ("1234.56") and Mongoose casts them to Decimal128 — never Number.
 */
function isDecimalString(value) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error('must be a decimal value');
  }
  if (!/^-?\d+(\.\d{1,})?$/.test(String(value))) {
    throw new Error('must be a valid decimal (e.g. 1234.56)');
  }
  return true;
}

module.exports = { validate, isDecimalString };
