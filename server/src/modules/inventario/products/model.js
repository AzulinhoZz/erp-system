'use strict';

const mongoose = require('mongoose');

/**
 * products — sku, name, category, unit, cost (Decimal128), price (Decimal128), stock.
 * - cost/price are money → Decimal128 (never Number).
 * - stock is a plain quantity counter (not money) → Number.
 * - companyId added for multi-tenancy (same rule as branches/users).
 * - minStock drives the low-stock notification to purchasing.
 */
const productSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: '', trim: true },
    unit: { type: String, default: 'pcs', trim: true },
    cost: { type: mongoose.Schema.Types.Decimal128, required: true, default: '0' },
    price: { type: mongoose.Schema.Types.Decimal128, required: true, default: '0' },
    stock: { type: Number, default: 0, min: 0 },
    minStock: { type: Number, default: 0, min: 0 },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  },
  { timestamps: true }
);

productSchema.index({ companyId: 1, name: 1 });

module.exports = mongoose.model('Product', productSchema);
