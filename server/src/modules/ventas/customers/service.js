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

async function getById(id, companyId) {
  const customer = await Customer.findOne({ _id: id, companyId });
  if (!customer) throw new ApiError(404, 'Customer not found');
  return customer;
}

async function create(data) {
  return Customer.create(data);
}

async function update(id, data, companyId) {
  const customer = await Customer.findOneAndUpdate({ _id: id, companyId }, data, {
    new: true,
    runValidators: true,
  });
  if (!customer) throw new ApiError(404, 'Customer not found');
  return customer;
}

module.exports = { list, getById, create, update };
