'use strict';

const mongoose = require('mongoose');
const PurchaseOrder = require('./model');
const Supplier = require('../suppliers/model');
const Product = require('../../inventario/products/model');
const StockMovement = require('../../inventario/stockMovements/model');
const Warehouse = require('../../inventario/warehouses/model');
const { postAutomaticEntry } = require('../../finanzas/journalEntries/service');
const { ApiError } = require('../../../middlewares/errorHandler');

/** Total is ALWAYS computed server-side from items (Decimal128-safe). */
function computeTotal(items) {
  const total = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
    0
  );
  return total.toFixed(2);
}

async function list({ companyId, status, page = 1, limit = 20 }) {
  const query = {};
  if (companyId) query.companyId = companyId;
  if (status) query.status = status;
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    PurchaseOrder.find(query)
      .populate('supplierId', 'name taxId')
      .populate('items.productId', 'sku name unit')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit)),
    PurchaseOrder.countDocuments(query),
  ]);
  return { items, total, page: Number(page), limit: Number(limit) };
}

async function getById(id, companyId) {
  const po = await PurchaseOrder.findOne({ _id: id, companyId })
    .populate('supplierId', 'name taxId')
    .populate('items.productId', 'sku name unit');
  if (!po) throw new ApiError(404, 'Purchase order not found');
  return po;
}

/** POST /purchase-orders — status 'draft', total computed here. */
async function create({ supplierId, items, date, warehouseId, companyId }) {
  if (!items || !items.length) throw new ApiError(400, 'At least one item is required');

  const supplier = await Supplier.findOne({ _id: supplierId, companyId });
  if (!supplier) throw new ApiError(400, 'supplierId does not match an existing supplier');

  for (const item of items) {
    const product = await Product.findOne({ _id: item.productId, companyId });
    if (!product) throw new ApiError(400, `productId ${item.productId} does not exist`);
  }

  return PurchaseOrder.create({
    supplierId,
    items,
    date: date || new Date(),
    warehouseId,
    companyId,
    status: 'draft',
    total: computeTotal(items),
  });
}

/**
 * POST /purchase-orders/:id/receive — THE purchasing→inventory integration.
 *
 * One ACID transaction:
 *   1. loads the PO (must be draft/confirmed, not cancelled/received)
 *   2. validates destination warehouse
 *   3. per item: inserts a StockMovement(type 'in') + $inc products.stock
 *   4. marks the PO as 'received'
 * Stock only increases AFTER a successful commit.
 */
async function receive(id, { warehouseId, companyId } = {}) {
  const session = await mongoose.startSession();
  try {
    let result;

    await session.withTransaction(async () => {
      const po = await PurchaseOrder.findOne({ _id: id, companyId }).session(session);
      if (!po) throw new ApiError(404, 'Purchase order not found');
      if (!['draft', 'confirmed'].includes(po.status)) {
        throw new ApiError(409, `Cannot receive a purchase order in status '${po.status}'`);
      }

      const destination = warehouseId || po.warehouseId;
      if (!destination) throw new ApiError(400, 'warehouseId is required to receive the order');
      const warehouse = await Warehouse.findOne({ _id: destination }).populate({ path: 'branchId', match: { companyId } }).session(session);
      if (!warehouse) throw new ApiError(400, 'warehouseId does not match an existing warehouse');

      for (const item of po.items) {
        await StockMovement.create(
          [
            {
              productId: item.productId,
              warehouseId: destination,
              type: 'in',
              quantity: item.quantity,
              date: new Date(),
              reference: `PO-${String(po._id).slice(-6).toUpperCase()}`,
            },
          ],
          { session }
        );
        await Product.updateOne(
          { _id: item.productId },
          { $inc: { stock: item.quantity } },
          { session }
        );
      }

      po.status = 'received';
      po.warehouseId = destination;
      await po.save({ session });

      // --- auto journal entry (same transaction) --------------------
      // Debit Inventarios / Crédito Cuentas por pagar. Skipped with a
      // warning when settings.defaultAccounts is not configured.
      await postAutomaticEntry({
        session,
        companyId: po.companyId,
        debitKey: 'inventory',
        creditKey: 'accountsPayable',
        amount: Number(po.total?.$numberDecimal ?? po.total ?? 0),
        date: new Date(),
        reference: `PO-${String(po._id).slice(-6).toUpperCase()}`,
      });

      result = po;
    });

    return result;
  } finally {
    session.endSession();
  }
}

module.exports = { list, getById, create, receive };
