'use strict';

const Employee = require('./model');
const Branch = require('../../core/branches/model');
const { ApiError } = require('../../../middlewares/errorHandler');

async function list({ companyId, q, isActive, page = 1, limit = 20 }) {
  const query = {};
  if (companyId) query.companyId = companyId;
  if (isActive !== undefined) query.isActive = isActive;
  if (q) query.name = new RegExp(q, 'i');
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Employee.find(query)
      .populate('branchId', 'name')
      .sort({ name: 1 })
      .skip(skip)
      .limit(Number(limit)),
    Employee.countDocuments(query),
  ]);
  return { items, total, page: Number(page), limit: Number(limit) };
}

async function getById(id, companyId) {
  const employee = await Employee.findOne({ _id: id, companyId }).populate('branchId', 'name');
  if (!employee) throw new ApiError(404, 'Employee not found');
  return employee;
}

async function create(data) {
  const branch = await Branch.findOne({ _id: data.branchId, companyId: data.companyId });
  if (!branch) throw new ApiError(400, 'branchId does not match an existing branch');
  // Denormalize the company from the branch so scoping stays consistent
  return Employee.create({ ...data, companyId: branch.companyId });
}

async function update(id, data, companyId) {
  if (data.branchId) {
    const branch = await Branch.findOne({ _id: data.branchId, companyId: data.companyId });
    if (!branch) throw new ApiError(400, 'branchId does not match an existing branch');
    data = { ...data, companyId: branch.companyId };
  }
  const employee = await Employee.findOneAndUpdate({ _id: id, companyId }, data, {
    new: true,
    runValidators: true,
  });
  if (!employee) throw new ApiError(404, 'Employee not found');
  return employee;
}

module.exports = { list, getById, create, update };
