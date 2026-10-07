'use strict';

const Product = require('./model');
const { ApiError } = require('../../../middlewares/errorHandler');

function buildQuery({ companyId, q, category }) {
  const query = { isActive: { $ne: false } };
  if (companyId) query.companyId = companyId;
  if (category) query.category = category;
  if (q) {
    query.$or = [{ name: new RegExp(q, 'i') }, { sku: new RegExp(q, 'i') }];
  }
  return query;
}

/** GET /products — paginated, company scoped, searchable by name/sku. */
async function list({ companyId, q, category, page = 1, limit = 20 }) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const query = buildQuery({ companyId, q, category });
  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await Promise.all([
    Product.find(query).sort({ name: 1 }).skip(skip).limit(safeLimit),
    Product.countDocuments(query),
  ]);
  return { items, total, page: safePage, limit: safeLimit };
}

async function getById(id, companyId) {
  const product = await Product.findOne({
    _id: id,
    isActive: { $ne: false },
    ...(companyId && { companyId }),
  });
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
}

/** POST /products — stock inicial solo al crear (los cambios son movimientos). */
async function create(data) {
  if (Number(data.stock || 0) !== 0) {
    throw new ApiError(400, 'Initial stock must be recorded as a stock movement');
  }
  if (!data.companyId) throw new ApiError(400, 'companyId is required');

  if (data.sku) {
    const dup = await Product.findOne({ sku: String(data.sku).toUpperCase(), ...(data.companyId && { companyId: data.companyId }) });
    if (dup) throw new ApiError(409, 'SKU already exists');
  }
  const { sku, name, category, unit, cost, price, minStock, companyId } = data;
  return Product.create({
    sku,
    name,
    category,
    unit,
    cost,
    price,
    stock: 0,
    minStock,
    companyId,
    isActive: true,
  });
}

/**
 * PUT /products/:id — name/category/unit/cost/price/minStock only.
 * stock is NOT editable here: it only changes through stock movements
 * (keeps the movement ledger consistent).
 */
async function update(id, data, companyId) {
  const { name, category, unit, cost, price, minStock } = data;
  const safe = { name, category, unit, cost, price, minStock };
  Object.keys(safe).forEach((key) => safe[key] === undefined && delete safe[key]);
  const product = await Product.findOneAndUpdate(
    { _id: id, isActive: { $ne: false }, ...(companyId && { companyId }) },
    safe,
    {
    new: true,
    runValidators: true,
    }
  );
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
}

async function deactivate(id, companyId) {
  const product = await Product.findOneAndUpdate(
    { _id: id, isActive: { $ne: false }, ...(companyId && { companyId }) },
    { isActive: false },
    { new: true, runValidators: true }
  );
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
}

module.exports = { list, getById, create, update, deactivate };
