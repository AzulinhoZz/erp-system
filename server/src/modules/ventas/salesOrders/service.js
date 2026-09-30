'use strict';

const mongoose = require('mongoose');
const SalesOrder = require('./model');
const Customer = require('../customers/model');
const Invoice = require('../invoices/model');
const Product = require('../../inventario/products/model');
const StockMovement = require('../../inventario/stockMovements/model');
const Warehouse = require('../../inventario/warehouses/model');
const { ApiError } = require('../../../middlewares/errorHandler');
const { emitToCompany } = require('../../../sockets');
const { createNotification } = require('../../notificaciones/notifications/service');

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
    SalesOrder.find(query)
      .populate('customerId', 'name taxId creditLimit')
      .populate('items.productId', 'sku name unit')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit)),
    SalesOrder.countDocuments(query),
  ]);
  return { items, total, page: Number(page), limit: Number(limit) };
}

async function getById(id, companyId) {
  const so = await SalesOrder.findOne({ _id: id, companyId })
    .populate('customerId', 'name taxId creditLimit')
    .populate('items.productId', 'sku name unit');
  if (!so) throw new ApiError(404, 'Sales order not found');
  return so;
}

/** POST /sales-orders — status 'draft', total computed here. */
async function create({ customerId, items, date, warehouseId, companyId }) {
  if (!items || !items.length) throw new ApiError(400, 'At least one item is required');

  const customer = await Customer.findOne({ _id: customerId, companyId });
  if (!customer) throw new ApiError(400, 'customerId does not match an existing customer');

  for (const item of items) {
    const product = await Product.findOne({ _id: item.productId, companyId });
    if (!product) throw new ApiError(400, `productId ${item.productId} does not exist`);
  }

  return SalesOrder.create({
    customerId,
    items,
    date: date || new Date(),
    warehouseId,
    companyId,
    status: 'draft',
    total: computeTotal(items),
  });
}

/**
 * POST /sales-orders/:id/confirm — THE sales→inventory integration.
 *
 * One ACID transaction:
 *   1. loads the SO (must be 'draft')
 *   2. credit check: order total + outstanding (unpaid invoices + confirmed
 *      orders) must fit inside the customer's creditLimit (0 = unlimited)
 *   3. per item: verifies enough stock, inserts a StockMovement(type 'out')
 *      and $inc-decrements products.stock — rollback if ANY item fails
 *   4. marks the SO as 'confirmed'
 * After commit: emits 'stock.low' events for products that crossed their
 * minimum (Socket.io → purchasing alert).
 */
async function confirm(id, { warehouseId, companyId } = {}) {
  const session = await mongoose.startSession();
  try {
    let so;
    const touchedProductIds = [];

    await session.withTransaction(async () => {
      so = await SalesOrder.findOne({ _id: id, companyId }).session(session);
      if (!so) throw new ApiError(404, 'Sales order not found');
      if (so.status !== 'draft') {
        throw new ApiError(409, `Cannot confirm a sales order in status '${so.status}'`);
      }

      const source = warehouseId || so.warehouseId;
      if (!source) throw new ApiError(400, 'warehouseId is required to confirm the order');
      const warehouse = await Warehouse.findOne({ _id: source }).populate({ path: 'branchId', match: { companyId } }).session(session);
      if (!warehouse) throw new ApiError(400, 'warehouseId does not match an existing warehouse');

      // --- credit limit check ---------------------------------------
      const customer = await Customer.findById(so.customerId).session(session);
      const limit = Number(customer.creditLimit?.$numberDecimal ?? customer.creditLimit ?? 0);
      if (limit > 0) {
        const orderTotal = Number(so.total?.$numberDecimal ?? so.total ?? 0);

        const unpaid = await Invoice.aggregate([
          { $match: { customerId: customer._id, status: { $in: ['pending', 'overdue'] } } },
          { $group: { _id: null, sum: { $sum: '$amount' } } },
        ]).session(session);

        const otherOrders = await SalesOrder.aggregate([
          {
            $match: {
              customerId: customer._id,
              _id: { $ne: so._id },
              status: { $in: ['confirmed', 'invoiced'] },
            },
          },
          { $group: { _id: null, sum: { $sum: '$total' } } },
        ]).session(session);

        // aggregate returns Decimal128 values → convert before adding
        const outstanding =
          Number(unpaid[0]?.sum ?? 0) + Number(otherOrders[0]?.sum ?? 0);
        if (outstanding + orderTotal > limit) {
          throw new ApiError(
            409,
            `Credit limit exceeded: limit ${limit}, outstanding ${outstanding}, order ${orderTotal}`
          );
        }
      }

      // --- stock validation + movements -----------------------------
      for (const item of so.items) {
        const product = await Product.findById(item.productId).session(session);
        if (!product) throw new ApiError(400, `productId ${item.productId} does not exist`);
        if (product.stock < item.quantity) {
          throw new ApiError(
            409,
            `Insufficient stock for ${product.sku}: available ${product.stock}, requested ${item.quantity}`
          );
        }

        await StockMovement.create(
          [
            {
              productId: item.productId,
              warehouseId: source,
              type: 'out',
              quantity: item.quantity,
              date: new Date(),
              reference: `SO-${String(so._id).slice(-6).toUpperCase()}`,
            },
          ],
          { session }
        );
        await Product.updateOne(
          { _id: item.productId },
          { $inc: { stock: -item.quantity } },
          { session }
        );
        touchedProductIds.push(item.productId);
      }

      so.status = 'confirmed';
      so.warehouseId = source;
      await so.save({ session });
    });

    // --- after commit: low-stock notifications ---------------------
    try {
      const touched = await Product.find({ _id: { $in: touchedProductIds } });
      for (const product of touched) {
        if (product.minStock > 0 && product.stock <= product.minStock && product.companyId) {
          const payload = {
            productId: product._id,
            sku: product.sku,
            name: product.name,
            stock: product.stock,
            minStock: product.minStock,
            date: new Date(),
          };
          emitToCompany(product.companyId.toString(), 'stock.low', payload);
          await createNotification({
            companyId: product.companyId,
            type: 'alert',
            title: 'Stock bajo',
            message: `${product.sku} — ${product.name}: quedan ${product.stock} (mín. ${product.minStock})`,
          });
        }
      }
    } catch {
      /* sockets must never break the business flow */
    }

    return so;
  } finally {
    session.endSession();
  }
}

module.exports = { list, getById, create, confirm };
