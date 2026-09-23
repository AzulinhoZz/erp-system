'use strict';

const mongoose = require('mongoose');
const { ORDER_STATUS } = require('@erp/shared');

/**
 * purchaseOrders — supplierId (ref), items[], status, total (Decimal128), date.
 * items[]: { productId (ref), quantity, unitPrice (Decimal128) }
 * total is computed server-side from items (never trusted from the client).
 * warehouseId: destination warehouse used when the order is received.
 */
const purchaseOrderSchema = new mongoose.Schema(
  {
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: mongoose.Schema.Types.Decimal128, required: true },
        _id: false,
      },
    ],
    status: { type: String, enum: ORDER_STATUS, default: 'draft' },
    total: { type: mongoose.Schema.Types.Decimal128, required: true, default: '0' },
    date: { type: Date, default: Date.now },
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ companyId: 1, date: -1 });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
