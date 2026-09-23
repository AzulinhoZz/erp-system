'use strict';

const Warehouse = require('./model');
const Branch = require('../../core/branches/model');
const { ApiError } = require('../../../middlewares/errorHandler');

/** GET /warehouses — filtered by the caller's company through branchId. */
async function list({ companyId }) {
  const query = {};
  if (companyId) {
    const branches = await Branch.find({ companyId }).select('_id');
    query.branchId = { $in: branches.map((b) => b._id) };
  }
  return Warehouse.find(query).populate('branchId', 'name companyId').sort({ name: 1 });
}

async function getById(id) {
  const warehouse = await Warehouse.findById(id).populate('branchId', 'name companyId');
  if (!warehouse) throw new ApiError(404, 'Warehouse not found');
  return warehouse;
}

async function create(data) {
  const branch = await Branch.findById(data.branchId);
  if (!branch) throw new ApiError(400, 'branchId does not match an existing branch');
  return Warehouse.create(data);
}

async function update(id, data) {
  const warehouse = await Warehouse.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!warehouse) throw new ApiError(404, 'Warehouse not found');
  return warehouse;
}

module.exports = { list, getById, create, update };
