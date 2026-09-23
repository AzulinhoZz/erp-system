'use strict';

const mongoose = require('mongoose');

/**
 * attendance — employeeId (ref), date, checkIn, checkOut.
 * checkIn/checkOut are 'HH:MM' strings (shift marks, not full timestamps).
 * One row per employee per day (unique compound index).
 */
const attendanceSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    checkIn: { type: String, default: '', match: /^$|^([01]\d|2[0-3]):[0-5]\d$/ },
    checkOut: { type: String, default: '', match: /^$|^([01]\d|2[0-3]):[0-5]\d$/ },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  },
  { timestamps: true }
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ companyId: 1, date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
