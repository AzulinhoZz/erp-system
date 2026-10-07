'use strict';

const mongoose = require('mongoose');
const StockMovement = require('./model');
const Product = require('../products/model');
const Warehouse = require('../warehouses/model');
const Branch = require('../../core/branches/model');
const { ApiError } = require('../../../middlewares/errorHandler');
const { emitToCompany } = require('../../../sockets');
const { createNotification } = require('../../notificaciones/notifications/service');

function movementDelta(type, quantity) {
  if (!Number.isInteger(quantity)) {
    throw new ApiError(400, 'quantity must be an integer');
  }
  if (type === 'adjustment') {
    if (quantity === 0) throw new ApiError(400, 'adjustment quantity cannot be zero');
    return quantity;
  }
  if (!['in', 'out'].includes(type) || quantity <= 0) {
    throw new ApiError(400, 'in/out movements require a positive integer quantity');
  }
  return type === 'in' ? quantity : -quantity;
}

async function validateWarehouse(warehouseId, companyId, session) {
  const allowedBranches = companyId
    ? await Branch.find({ companyId }).distinct('_id').session(session)
    : null;
  const warehouse = await Warehouse.findOne({
    _id: warehouseId,
    ...(allowedBranches && { branchId: { $in: allowedBranches } }),
  }).session(session);
  if (!warehouse) throw new ApiError(404, 'Warehouse not found');
}

async function updateStock(product, delta, session) {
  const query = { _id: product._id, companyId: product.companyId };
  if (delta < 0) query.stock = { $gte: -delta };
  const result = await Product.updateOne(query, { $inc: { stock: delta } }, { session });
  if (result.matchedCount !== 1) {
    throw new ApiError(409, `Insufficient stock: available ${product.stock}, requested ${-delta}`);
  }
  return product.stock + delta;
}

function notifyLowStock(product) {
  if (
    !product ||
    !Number.isFinite(product.minStock) ||
    product.minStock <= 0 ||
    product.stock > product.minStock
  ) return;

  try {
    emitToCompany(product.companyId.toString(), 'stock.low', {
      productId: product._id,
      sku: product.sku,
      name: product.name,
      stock: product.stock,
      minStock: product.minStock,
      date: new Date(),
    });
    void createNotification({
      companyId: product.companyId,
      type: 'alert',
      title: 'Stock bajo',
      message: `${product.sku} — ${product.name}: quedan ${product.stock} (mín. ${product.minStock})`,
    }).catch((err) => {
      console.error('[notifications] failed to persist low-stock alert:', err.message);
    });
  } catch (err) {
    console.error('[notifications] failed to emit low-stock alert:', err.message);
  }
}

/**
 * Appends an inventory movement and updates the product counter in one MongoDB
 * transaction. Adjustments store their signed delta; IN and OUT stay positive.
 */
async function create({
  productId,
  warehouseId,
  type,
  quantity,
  date,
  reference,
  companyId,
  userId,
}) {
  const qty = Number(quantity);
  const delta = movementDelta(type, qty);
  const session = await mongoose.startSession();
  let movement;
  let resultingProduct;

  try {
    await session.withTransaction(async () => {
      const product = await Product.findOne({
        _id: productId,
        ...(companyId && { companyId }),
        isActive: { $ne: false },
      }).session(session);
      if (!product) throw new ApiError(404, 'Product not found');

      await validateWarehouse(warehouseId, product.companyId, session);

      const previousStock = product.stock;
      const newStock = await updateStock(product, delta, session);
      [movement] = await StockMovement.create(
        [{
          productId,
          warehouseId,
          companyId: product.companyId,
          userId,
          type,
          quantity: qty,
          previousStock,
          newStock,
          date: date || new Date(),
          reference: reference || '',
        }],
        { session }
      );
      resultingProduct = { ...product.toObject(), stock: newStock };
    });
  } finally {
    await session.endSession();
  }

  notifyLowStock(resultingProduct);
  return movement;
}

async function reverse(id, { companyId, userId, reason = '' }) {
  const session = await mongoose.startSession();
  let reversal;
  let resultingProduct;

  try {
    await session.withTransaction(async () => {
      const original = await StockMovement.findOne({ _id: id }).session(session);
      if (!original) throw new ApiError(404, 'Stock movement not found');
      if (await StockMovement.exists({ reversalOf: original._id }).session(session)) {
        throw new ApiError(409, 'Stock movement has already been reversed');
      }

      const product = await Product.findOne({
        _id: original.productId,
        ...(companyId && { companyId }),
      }).session(session);
      if (!product) throw new ApiError(404, 'Stock movement not found');
      await validateWarehouse(original.warehouseId, product.companyId, session);

      const originalDelta = movementDelta(original.type, original.quantity);
      const reverseDelta = -originalDelta;
      const reversalType = original.type === 'adjustment'
        ? 'adjustment'
        : original.type === 'in' ? 'out' : 'in';
      const previousStock = product.stock;
      const newStock = await updateStock(product, reverseDelta, session);
      [reversal] = await StockMovement.create(
        [{
          productId: original.productId,
          warehouseId: original.warehouseId,
          companyId: product.companyId,
          userId,
          type: reversalType,
          quantity: reversalType === 'adjustment' ? reverseDelta : Math.abs(reverseDelta),
          previousStock,
          newStock,
          reversalOf: original._id,
          date: new Date(),
          reference: reason ? `Reversal: ${reason}` : `Reversal of ${original._id}`,
        }],
        { session }
      );
      resultingProduct = { ...product.toObject(), stock: newStock };
    });
  } finally {
    await session.endSession();
  }

  notifyLowStock(resultingProduct);
  return reversal;
}

/** GET /stock-movements — paginated ledger with populated refs. */
async function list({ productId, warehouseId, companyId, page = 1, limit = 20 }) {
  const query = {};
  if (companyId) {
    const products = await Product.find({ companyId }).distinct('_id');
    const branches = await Branch.find({ companyId }).distinct('_id');
    const warehouses = await Warehouse.find({ branchId: { $in: branches } }).distinct('_id');
    query.productId = { $in: products };
    query.warehouseId = { $in: warehouses };
  }
  if (productId) {
    if (companyId) {
      const owned = await Product.exists({ _id: productId, companyId });
      if (!owned) throw new ApiError(404, 'Product not found');
    }
    query.productId = productId;
  }
  if (warehouseId) {
    if (companyId) {
      const branches = await Branch.find({ companyId }).distinct('_id');
      const owned = await Warehouse.exists({ _id: warehouseId, branchId: { $in: branches } });
      if (!owned) throw new ApiError(404, 'Warehouse not found');
    }
    query.warehouseId = warehouseId;
  }
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await Promise.all([
    StockMovement.find(query)
      .populate('productId', 'sku name unit')
      .populate('warehouseId', 'name')
      .populate('userId', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(safeLimit),
    StockMovement.countDocuments(query),
  ]);
  const reversals = items.length
    ? await StockMovement.find({ reversalOf: { $in: items.map((item) => item._id) } })
      .select('reversalOf')
      .lean()
    : [];
  const reversedIds = new Set(reversals.map((item) => String(item.reversalOf)));
  return {
    items: items.map((item) => ({
      ...item.toObject(),
      isReversed: reversedIds.has(String(item._id)),
    })),
    total,
    page: safePage,
    limit: safeLimit,
  };
}

module.exports = { create, reverse, list, movementDelta };
