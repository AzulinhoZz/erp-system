'use strict';

const { body, query } = require('express-validator');

const runValidators = [
  body('period').matches(/^\d{4}-\d{2}$/).withMessage("period must be 'YYYY-MM'"),
  body('employeeIds').optional().isArray(),
  body('employeeIds.*').optional().isMongoId(),
  body('companyId').optional().isMongoId(),
];

const listValidators = [
  query('period').optional().matches(/^\d{4}-\d{2}$/),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 200 }),
];

module.exports = { runValidators, listValidators };
