'use strict';

const mongoose = require('mongoose');
const StockMovement = require('./model');
const Product = require('../products/model');
const Warehouse = require('../warehouses/model');
const { ApiError } = require('../../../middlewares/errorHandler');
const { emitToCompany } = require('../../../sockets');
const { createNotification } = require('../../notificaciones/notifications/service');

/**
 * POST /stock-movements — THE transactional core of inventory.
 *
 * A single ACID transaction (MongoDB replica set / Atlas):
 *   1. validates product + warehouse
 *   2. rejects 'out' movements exceeding available stock
 *   3. inserts the movement (append-only ledger)
 *   4. increments/decrements products.stock atomically ($inc)
 *   5. on low stock (stock <= minStock) emits a real-time 'stock.low'
 *      event to the company room → purchasing alert (Socket.io)
 */
async function create({ productId, warehouseId, type, quantity, date, reference, companyId }) {
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty <= 0) {
    throw new ApiError(400, 'quantity must be a positive integer');
  }

  const session = await mongoose.startSession();
  try {
    let movement;
    let product;

    await session.withTransaction(async () => {
      product = await Product.findOne({ _id: productId, companyId }).session(session);
      if (!product) throw new ApiError(404, 'Product not found');

      const warehouse = await Warehouse.findById(warehouseId).populate({ path: 'branchId', match: { companyId } }).session(session);
      if (!warehouse) throw new ApiError(404, 'Warehouse not found');

      if (type === 'out' && product.stock < qty) {
        throw new ApiError(409, `Insufficient stock: available ${product.stock}, requested ${qty}`);
      }

      [movement] = await StockMovement.create(
        [
          {
            productId,
            warehouseId,
            type,
            quantity: qty,
            date: date || new Date(),
            reference: reference || '',
          },
        ],
        { session }
      );

      await Product.updateOne(
        { _id: productId },
        { $inc: { stock: type === 'in' ? qty : -qty } },
        { session }
      );
    });

    // --- after commit: refresh + notify (never inside the transaction) ---
    product = await Product.findById(productId);
    if (
      product &&
      Number.isFinite(product.minStock) &&
      product.minStock > 0 &&
      product.stock <= product.minStock
    ) {
      try {
        emitToCompany(product.companyId.toString(), 'stock.low', {
          productId: product._id,
          sku: product.sku,
          name: product.name,
          stock: product.stock,
          minStock: product.minStock,
          date: new Date(),
        });
        // Persist so the notification survives reconnects (GET /notifications)
        await createNotification({
          companyId: product.companyId,
          type: 'alert',
          title: 'Stock bajo',
          message: `${product.sku} — ${product.name}: quedan ${product.stock} (mín. ${product.minStock})`,
        });
      } catch {
        /* sockets must never break the business flow */
      }
    }

    return movement;
  } finally {
    session.endSession();
  }
}

/** GET /stock-movements — paginated ledger with populated refs. */
async function list({ productId, warehouseId, companyId, page = 1, limit = 20 }) {
  const query = { companyId };
  if (productId) query.productId = productId;
  if (warehouseId) query.warehouseId = warehouseId;
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    StockMovement.find(query)
      .populate('productId', 'sku name unit')
      .populate('warehouseId', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit)),
    StockMovement.countDocuments(query),
  ]);
  return { items, total, page: Number(page), limit: Number(limit) };
}

module.exports = { create, list };
