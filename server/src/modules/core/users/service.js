'use strict';

const bcrypt = require('bcryptjs');
const User = require('./model');
const Role = require('../roles/model');
const { ApiError } = require('../../../middlewares/errorHandler');
const { PERMISSIONS } = require('@erp/shared');

const SALT_ROUNDS = 10;
const PLATFORM_ROLE_PERMISSIONS = new Set([
  PERMISSIONS.COMPANIES_READ,
  PERMISSIONS.COMPANIES_WRITE,
  PERMISSIONS.ROLES_WRITE,
]);

function buildQuery({ companyId, q, isActive }) {
  const query = {};
  if (companyId) query.companyId = companyId;
  if (isActive !== undefined) query.isActive = isActive;
  if (q) query.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
  return query;
}

async function roleOrThrow(roleId) {
  const role = await Role.findById(roleId);
  if (!role) throw new ApiError(400, 'roleId does not match an existing role');
  return role;
}

async function assertRoleAssignmentAllowed(targetRoleId, actor) {
  const targetRole = await roleOrThrow(targetRoleId);
  if (
    actor?.companyId &&
    (targetRole.permissions || []).some(
      (permission) => permission === '*' || PLATFORM_ROLE_PERMISSIONS.has(permission)
    )
  ) {
    throw new ApiError(403, 'Company administrators cannot assign platform permissions');
  }
  if (!(targetRole.permissions || []).includes('*')) return targetRole;

  const actorRole = actor?.roleId ? await Role.findById(actor.roleId).lean() : null;
  if (!actorRole || !(actorRole.permissions || []).includes('*')) {
    throw new ApiError(403, 'Only a platform administrator can assign a wildcard role');
  }
  return targetRole;
}

/** GET /users — paginated and company scoped for tenant users. */
async function list({ companyId, q, isActive, page = 1, limit = 20 }) {
  const query = buildQuery({ companyId, q, isActive });
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const safePage = Math.max(1, Number(page) || 1);
  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await Promise.all([
    User.find(query)
      .populate('roleId', 'name')
      .populate('companyId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    User.countDocuments(query),
  ]);

  return { items, total, page: safePage, limit: safeLimit };
}

async function getById(id, actor = {}) {
  const query = { _id: id };
  if (actor.companyId) query.companyId = actor.companyId;
  const user = await User.findOne(query)
    .populate('roleId', 'name permissions')
    .populate('companyId', 'name');
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

/** POST /users */
async function create(data, actor = {}) {
  const { password, ...rest } = data;
  if (!password) throw new ApiError(400, 'Password is required');

  if (actor.companyId) rest.companyId = actor.companyId;
  if (!rest.companyId) throw new ApiError(400, 'companyId is required');

  await assertRoleAssignmentAllowed(rest.roleId, actor);

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const safe = {
    name: rest.name,
    email: rest.email,
    roleId: rest.roleId,
    companyId: rest.companyId,
    isActive: rest.isActive,
    passwordHash,
  };
  Object.keys(safe).forEach((key) => safe[key] === undefined && delete safe[key]);
  try {
    return await User.create(safe);
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, 'Email already exists');
    throw err;
  }
}

/** PUT /users/:id — tenant-safe; password is hashed only when provided. */
async function update(id, data, actor = {}) {
  const { password, name, email, roleId, isActive } = data;
  const rest = { name, email, roleId, isActive };
  Object.keys(rest).forEach((key) => rest[key] === undefined && delete rest[key]);

  if (rest.roleId) await assertRoleAssignmentAllowed(rest.roleId, actor);

  const query = { _id: id };
  if (actor.companyId) query.companyId = actor.companyId;
  const user = await User.findOne(query);
  if (!user) throw new ApiError(404, 'User not found');
  if (
    actor.userId &&
    String(actor.userId) === String(id) &&
    rest.isActive === false
  ) {
    throw new ApiError(409, 'You cannot deactivate your own account');
  }

  Object.assign(user, rest);
  if (password) user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  try {
    await user.save();
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, 'Email already exists');
    throw err;
  }
  return user;
}

async function deactivate(id, actor = {}) {
  if (actor.userId && String(actor.userId) === String(id)) {
    throw new ApiError(409, 'You cannot deactivate your own account');
  }

  const query = { _id: id, ...(actor.companyId && { companyId: actor.companyId }) };
  const user = await User.findOne(query);
  if (!user) throw new ApiError(404, 'User not found');
  if (!user.isActive) return user;

  user.isActive = false;
  await user.save();
  return user;
}

module.exports = { list, getById, create, update, deactivate };
