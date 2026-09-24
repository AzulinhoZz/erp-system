'use strict';

const Branch = require('./model');
const { ApiError } = require('../../../middlewares/errorHandler');

async function list({ companyId }) {
  const query = companyId ? { companyId } : {};
  return Branch.find(query).populate('companyId', 'name').sort({ name: 1 });
}

async function getById(id, companyId) {
  const branch = await Branch.findOne({ _id: id, companyId }).populate('companyId', 'name');
  if (!branch) throw new ApiError(404, 'Branch not found');
  return branch;
}

async function create(data) {
  return Branch.create(data);
}

async function update(id, data, companyId) {
  const branch = await Branch.findOneAndUpdate({ _id: id, companyId }, data, { new: true, runValidators: true });
  if (!branch) throw new ApiError(404, 'Branch not found');
  return branch;
}

module.exports = { list, getById, create, update };
