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

async function getById(id, companyId) {
  const allowedBranches = companyId ? await Branch.find({ companyId }).distinct('_id') : null;
  const warehouse = await Warehouse.findOne({ _id: id, ...(allowedBranches && { branchId: { $in: allowedBranches } }) }).populate('branchId', 'name companyId');
  if (!warehouse) throw new ApiError(404, 'Warehouse not found');
  return warehouse;
}

async function create(data, companyId) {
  const branch = await Branch.findOne({ _id: data.branchId, ...(companyId && { companyId }) });
  if (!branch) throw new ApiError(400, 'branchId does not match an existing branch');
  return Warehouse.create(data);
}

async function update(id, data, companyId) {
  const allowedBranches = companyId ? await Branch.find({ companyId }).distinct('_id') : null;
  if (data.branchId) {
    const branch = await Branch.findOne({ _id: data.branchId, ...(companyId && { companyId }) });
    if (!branch) throw new ApiError(400, 'branchId does not match a branch in your company');
  }
  const warehouse = await Warehouse.findOneAndUpdate({ _id: id, ...(allowedBranches && { branchId: { $in: allowedBranches } }) }, data, {
    new: true,
    runValidators: true,
  });
  if (!warehouse) throw new ApiError(404, 'Warehouse not found');
  return warehouse;
}

module.exports = { list, getById, create, update };
