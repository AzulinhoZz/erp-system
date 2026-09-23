'use strict';

const mongoose = require('mongoose');
const Invoice = require('./model');
const SalesOrder = require('../salesOrders/model');
const { postAutomaticEntry } = require('../../finanzas/journalEntries/service');
const { ApiError } = require('../../../middlewares/errorHandler');
const { INVOICE_STATUS } = require('@erp/shared');

async function list({ companyId, status, page = 1, limit = 20 }) {
  const query = {};
  if (companyId) query.companyId = companyId;
  if (status) query.status = status;
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Invoice.find(query)
      .populate({
        path: 'salesOrderId',
        populate: { path: 'customerId', select: 'name taxId' },
      })
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(Number(limit)),
    Invoice.countDocuments(query),
  ]);
  return { items, total, page: Number(page), limit: Number(limit) };
}

/**
 * POST /invoices — one invoice per sales order, inside a transaction:
 *   1. loads the SO (must be 'confirmed'; amount defaults to SO total)
 *   2. creates the invoice (unique salesOrderId index enforces 1:1)
 *   3. moves the SO to status 'invoiced'
 * amount/dueDate are validated; amount can't exceed the order total.
 */
async function create({ salesOrderId, amount, dueDate, status }) {
  if (!dueDate) throw new ApiError(400, 'dueDate is required');
  if (!INVOICE_STATUS.includes(status || 'pending')) {
    throw new ApiError(400, 'Invalid invoice status');
  }

  const session = await mongoose.startSession();
  try {
    let invoice;

    await session.withTransaction(async () => {
      const so = await SalesOrder.findById(salesOrderId).session(session);
      if (!so) throw new ApiError(404, 'salesOrderId does not match an existing sales order');
      if (so.status !== 'confirmed') {
        throw new ApiError(409, `Only confirmed sales orders can be invoiced (status '${so.status}')`);
      }

      const soTotal = Number(so.total?.$numberDecimal ?? so.total ?? 0);
      const invoiceAmount = amount !== undefined ? Number(amount) : soTotal;
      if (Number.isNaN(invoiceAmount) || invoiceAmount <= 0) {
        throw new ApiError(400, 'amount must be a positive number');
      }
      if (invoiceAmount > soTotal) {
        throw new ApiError(400, `amount cannot exceed the order total (${soTotal.toFixed(2)})`);
      }

      const existing = await Invoice.findOne({ salesOrderId }).session(session);
      if (existing) throw new ApiError(409, 'This sales order already has an invoice');

      [invoice] = await Invoice.create(
        [
          {
            salesOrderId,
            amount: invoiceAmount.toFixed(2),
            dueDate,
            status: status || 'pending',
            companyId: so.companyId,
          },
        ],
        { session }
      );

      so.status = 'invoiced';
      await so.save({ session });

      // --- auto journal entry (same transaction) --------------------
      // Debit Cuentas por cobrar / Crédito Ingresos por ventas.
      // Skipped with a warning when the company hasn't configured
      // settings.defaultAccounts yet (never breaks the flow).
      await postAutomaticEntry({
        session,
        companyId: so.companyId,
        debitKey: 'accountsReceivable',
        creditKey: 'salesRevenue',
        amount: invoiceAmount,
        date: new Date(),
        reference: `INV-${String(invoice._id).slice(-6).toUpperCase()}`,
      });
    });

    return invoice;
  } finally {
    session.endSession();
  }
}

/** PUT /invoices/:id/status — paid/overdue/cancelled transitions. */
async function updateStatus(id, status) {
  if (!INVOICE_STATUS.includes(status)) throw new ApiError(400, 'Invalid invoice status');
  const invoice = await Invoice.findByIdAndUpdate(id, { status }, { new: true });
  if (!invoice) throw new ApiError(404, 'Invoice not found');
  return invoice;
}

module.exports = { list, create, updateStatus };
