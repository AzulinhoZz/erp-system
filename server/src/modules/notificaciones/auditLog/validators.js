'use strict';

const { query } = require('express-validator');

const listValidators = [
  query('entity').optional().isString().trim(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 200 }),
];

module.exports = { listValidators };
