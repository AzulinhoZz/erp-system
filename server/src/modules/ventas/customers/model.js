'use strict';

const mongoose = require('mongoose');

/**
 * customers — name, taxId, contact, creditLimit (Decimal128).
 * companyId added for multi-tenancy (same rule as core entities).
 */
const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    taxId: { type: String, required: true, trim: true },
    contact: { type: String, default: '' },
    creditLimit: { type: mongoose.Schema.Types.Decimal128, default: '0' },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  },
  { timestamps: true }
);

customerSchema.index({ companyId: 1, name: 1 });

module.exports = mongoose.model('Customer', customerSchema);
