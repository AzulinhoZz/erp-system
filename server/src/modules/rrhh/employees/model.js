'use strict';

const mongoose = require('mongoose');

/**
 * employees — name, position, branchId (ref), salary (Decimal128).
 * companyId denormalized from the branch for fast company scoping.
 * isActive lets payroll/attendance keep history after someone leaves.
 */
const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    salary: { type: mongoose.Schema.Types.Decimal128, required: true, default: '0' },
    isActive: { type: Boolean, default: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  },
  { timestamps: true }
);

employeeSchema.index({ companyId: 1, name: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
