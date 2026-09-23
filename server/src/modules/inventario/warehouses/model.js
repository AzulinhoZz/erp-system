'use strict';

const mongoose = require('mongoose');

/**
 * warehouses — name, branchId (ref), location.
 * branchId ties the warehouse to a branch (and through it, to a company).
 */
const warehouseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    location: { type: String, default: '' },
  },
  { timestamps: true }
);

warehouseSchema.index({ branchId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Warehouse', warehouseSchema);
