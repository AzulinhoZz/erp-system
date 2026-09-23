'use strict';

const mongoose = require('mongoose');

/**
 * payroll — employeeId (ref), period, grossPay/deductions/netPay (Decimal128).
 * period format: 'YYYY-MM'. One payroll row per employee per period
 * (unique compound index) so POST /payroll/run is idempotent.
 */
const payrollSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    period: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
    grossPay: { type: mongoose.Schema.Types.Decimal128, required: true },
    deductions: { type: mongoose.Schema.Types.Decimal128, required: true },
    netPay: { type: mongoose.Schema.Types.Decimal128, required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  },
  { timestamps: true }
);

payrollSchema.index({ employeeId: 1, period: 1 }, { unique: true });
payrollSchema.index({ companyId: 1, period: 1 });

module.exports = mongoose.model('Payroll', payrollSchema);
