'use strict';

const Customer = require('./model');
const { ApiError } = require('../../../middlewares/errorHandler');

async function list({ companyId, q, page = 1, limit = 20 }) {
  const query = {};
  if (companyId) query.companyId = companyId;
  if (q) query.name = new RegExp(q, 'i');
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Customer.find(query).sort({ name: 1 }).skip(skip).limit(Number(limit)),
    Customer.countDocuments(query),
  ]);
  return { items, total, page: Number(page), limit: Number(limit) };
}

async function getById(id) {
  const customer = await Customer.findById(id);
  if (!customer) throw new ApiError(404, 'Customer not found');
  return customer;
}

async function create(data) {
  return Customer.create(data);
}

async function update(id, data) {
  const customer = await Customer.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!customer) throw new ApiError(404, 'Customer not found');
  return customer;
}

module.exports = { list, getById, create, update };
