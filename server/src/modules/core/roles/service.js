'use strict';

const Role = require('./model');
const { ApiError } = require('../../../middlewares/errorHandler');
const { invalidateRoleCache } = require('../../../middlewares/rbac');

async function list() {
  return Role.find().sort({ name: 1 });
}

async function getById(id) {
  const role = await Role.findById(id);
  if (!role) throw new ApiError(404, 'Role not found');
  return role;
}

async function create({ name, permissions }) {
  const role = await Role.create({ name, permissions });
  invalidateRoleCache();
  return role;
}

async function update(id, data) {
  const role = await Role.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!role) throw new ApiError(404, 'Role not found');
  invalidateRoleCache(id);
  return role;
}

module.exports = { list, getById, create, update };
