'use strict';

const { body, query } = require('express-validator');
const { isDecimalString } = require('../../../middlewares/validate');
const { INVOICE_STATUS } = require('@erp/shared');

const createValidators = [
  body('salesOrderId').isMongoId().withMessage('salesOrderId must be a valid id'),
  body('amount').optional().custom(isDecimalString),
  body('dueDate').isISO8601().withMessage('dueDate must be a valid date'),
  body('status').optional().isIn(INVOICE_STATUS),
];

const updateStatusValidators = [
  body('status').isIn(INVOICE_STATUS).withMessage('Invalid invoice status'),
];

const listValidators = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(INVOICE_STATUS),
];

module.exports = { createValidators, updateStatusValidators, listValidators };
