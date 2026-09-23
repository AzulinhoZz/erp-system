'use strict';

const { body, query } = require('express-validator');
const { isDecimalString } = require('../../../middlewares/validate');

const createValidators = [
  body('date').optional().isISO8601(),
  body('reference').optional().isString(),
  body('companyId').optional().isMongoId(),
  body('lines').isArray({ min: 2 }).withMessage('lines must be an array of at least 2'),
  body('lines.*.accountId').isMongoId().withMessage('each line needs a valid accountId'),
  body('lines.*.debit').custom(isDecimalString).withMessage('debit must be a decimal string'),
  body('lines.*.credit').custom(isDecimalString).withMessage('credit must be a decimal string'),
];

const listValidators = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

module.exports = { createValidators, listValidators };
