'use strict';

const { body, query } = require('express-validator');

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const createValidators = [
  body('employeeId').isMongoId().withMessage('employeeId must be a valid id'),
  body('date').optional().isISO8601(),
  body('checkIn').optional().matches(HHMM).withMessage("checkIn must be 'HH:MM'"),
  body('checkOut').optional().matches(HHMM).withMessage("checkOut must be 'HH:MM'"),
  body('companyId').optional().isMongoId(),
];

const updateValidators = [
  body('checkIn').optional().matches(HHMM),
  body('checkOut').optional().matches(HHMM),
];

const listValidators = [
  query('date').optional().isISO8601(),
  query('employeeId').optional().isMongoId(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 200 }),
];

module.exports = { createValidators, updateValidators, listValidators };
