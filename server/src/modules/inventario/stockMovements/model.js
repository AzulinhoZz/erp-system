'use strict';

const mongoose = require('mongoose');
const { STOCK_MOVEMENT_TYPES } = require('@erp/shared');

/**
 * stockMovements — productId (ref), warehouseId (ref), type (in/out),
 * quantity, date, reference.
 * Append-only ledger: stock changes are never edited, only new movements added.
 */
const stockMovementSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    type: { type: String, enum: STOCK_MOVEMENT_TYPES, required: true },
    quantity: { type: Number, required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    previousStock: { type: Number, min: 0 },
    newStock: { type: Number, min: 0 },
    reversalOf: { type: mongoose.Schema.Types.ObjectId, ref: 'StockMovement' },
    date: { type: Date, default: Date.now },
    reference: { type: String, default: '' },
  },
  { timestamps: true }
);

stockMovementSchema.index({ productId: 1, warehouseId: 1, date: -1 });
stockMovementSchema.index({ reversalOf: 1 }, { unique: true, sparse: true });
stockMovementSchema.path('quantity').validate(function validateQuantity(value) {
  if (this.type === 'adjustment') return Number.isInteger(value) && value !== 0;
  return Number.isInteger(value) && value > 0;
}, 'quantity must be a non-zero integer for adjustments and a positive integer otherwise');

module.exports = mongoose.model('StockMovement', stockMovementSchema);
