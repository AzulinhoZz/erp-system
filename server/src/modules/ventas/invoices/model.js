'use strict';

const mongoose = require('mongoose');
const { INVOICE_STATUS } = require('@erp/shared');

/**
 * invoices — salesOrderId (ref), amount (Decimal128), dueDate, status.
 * One invoice per sales order (unique index) — amount defaults to the
 * order total when not provided.
 */
const invoiceSchema = new mongoose.Schema(
  {
    salesOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
      required: true,
      unique: true,
    },
    amount: { type: mongoose.Schema.Types.Decimal128, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: INVOICE_STATUS, default: 'pending' },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  },
  { timestamps: true }
);

invoiceSchema.index({ companyId: 1, dueDate: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
