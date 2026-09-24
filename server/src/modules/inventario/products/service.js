'use strict';

const Product = require('./model');
const { ApiError } = require('../../../middlewares/errorHandler');

function buildQuery({ companyId, q, category }) {
  const query = {};
  if (companyId) query.companyId = companyId;
  if (category) query.category = category;
  if (q) {
    query.$or = [{ name: new RegExp(q, 'i') }, { sku: new RegExp(q, 'i') }];
  }
  return query;
}

/** GET /products — paginated, company scoped, searchable by name/sku. */
async function list({ companyId, q, category, page = 1, limit = 20 }) {
  const query = buildQuery({ companyId, q, category });
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Product.find(query).sort({ name: 1 }).skip(skip).limit(Number(limit)),
    Product.countDocuments(query),
  ]);
  return { items, total, page: Number(page), limit: Number(limit) };
}

async function getById(id, companyId) {
  const product = await Product.findOne({ _id: id, companyId });
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
}

/** POST /products — stock inicial solo al crear (los cambios son movimientos). */
async function create(data) {
  if (data.sku) {
    const dup = await Product.findOne({ companyId: data.companyId, sku: String(data.sku).toUpperCase() });
    if (dup) throw new ApiError(409, 'SKU already exists');
  }
  return Product.create(data);
}

/**
 * PUT /products/:id — name/category/unit/cost/price/minStock only.
 * stock is NOT editable here: it only changes through stock movements
 * (keeps the movement ledger consistent).
 */
async function update(id, data, companyId) {
  const { stock, sku, companyId, ...safe } = data;
  const product = await Product.findByIdAndUpdate(id, safe, {
    new: true,
    runValidators: true,
  });
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
}

module.exports = { list, getById, create, update };
