'use strict';

const mongoose = require('mongoose');

/**
 * suppliers — name, taxId, contact.
 * companyId added for multi-tenancy (same rule as core entities).
 */
const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    taxId: { type: String, required: true, trim: true },
    contact: { type: String, default: '' },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  },
  { timestamps: true }
);

supplierSchema.index({ companyId: 1, name: 1 });

module.exports = mongoose.model('Supplier', supplierSchema);
