'use strict';

const { query, param } = require('express-validator');

const listValidators = [
  query('unreadOnly').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

const markReadValidators = [param('id').isMongoId()];

module.exports = { listValidators, markReadValidators };
