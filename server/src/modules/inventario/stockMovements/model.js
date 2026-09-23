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
    quantity: { type: Number, required: true, min: 1 },
    date: { type: Date, default: Date.now },
    reference: { type: String, default: '' },
  },
  { timestamps: true }
);

stockMovementSchema.index({ productId: 1, warehouseId: 1, date: -1 });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
