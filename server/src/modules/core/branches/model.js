'use strict';

const mongoose = require('mongoose');

/**
 * branches — name, companyId, address.
 * Belongs to a company; warehouses reference a branch.
 */
const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    address: { type: String, default: '' },
  },
  { timestamps: true }
);

branchSchema.index({ companyId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Branch', branchSchema);
