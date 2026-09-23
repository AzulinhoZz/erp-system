'use strict';

const { query } = require('express-validator');

const dateValidators = [
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('companyId').optional().isMongoId(),
];

const summaryValidators = [
  ...dateValidators,
  query('period').optional().matches(/^\d{4}-\d{2}$/),
];

module.exports = { dateValidators, summaryValidators };
