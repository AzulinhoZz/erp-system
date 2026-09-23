'use strict';

const bcrypt = require('bcryptjs');
const User = require('./model');
const Role = require('../roles/model');
const { ApiError } = require('../../../middlewares/errorHandler');

const SALT_ROUNDS = 10;

function buildQuery({ companyId, q, isActive }) {
  const query = {};
  if (companyId) query.companyId = companyId;
  if (isActive !== undefined) query.isActive = isActive;
  if (q) query.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
  return query;
}

/** GET /users — paginated, scoped to the caller's company. */
async function list({ companyId, q, isActive, page = 1, limit = 20 }) {
  const query = buildQuery({ companyId, q, isActive });
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    User.find(query)
      .populate('roleId', 'name')
      .populate('companyId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(query),
  ]);

  return { items, total, page: Number(page), limit: Number(limit) };
}

async function getById(id) {
  const user = await User.findById(id).populate('roleId', 'name permissions').populate('companyId', 'name');
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

/** POST /users */
async function create(data) {
  const { password, ...rest } = data;
  if (!password) throw new ApiError(400, 'Password is required');

  const role = await Role.findById(rest.roleId);
  if (!role) throw new ApiError(400, 'roleId does not match an existing role');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  return User.create({ ...rest, passwordHash });
}

/** PUT /users/:id — password only hashed when provided. */
async function update(id, data) {
  const { password, ...rest } = data;
  if (rest.roleId) {
    const role = await Role.findById(rest.roleId);
    if (!role) throw new ApiError(400, 'roleId does not match an existing role');
  }

  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');

  Object.assign(user, rest);
  if (password) user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await user.save();
  return user;
}

module.exports = { list, getById, create, update };
