'use strict';

const Supplier = require('./model');
const { ApiError } = require('../../../middlewares/errorHandler');

async function list({ companyId, q, page = 1, limit = 20 }) {
  const query = {};
  if (companyId) query.companyId = companyId;
  if (q) query.name = new RegExp(q, 'i');
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Supplier.find(query).sort({ name: 1 }).skip(skip).limit(Number(limit)),
    Supplier.countDocuments(query),
  ]);
  return { items, total, page: Number(page), limit: Number(limit) };
}

async function getById(id) {
  const supplier = await Supplier.findById(id);
  if (!supplier) throw new ApiError(404, 'Supplier not found');
  return supplier;
}

async function create(data) {
  return Supplier.create(data);
}

async function update(id, data) {
  const supplier = await Supplier.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!supplier) throw new ApiError(404, 'Supplier not found');
  return supplier;
}

module.exports = { list, getById, create, update };
