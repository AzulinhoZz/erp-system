'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../users/model');
const Role = require('../roles/model');
const { env } = require('../../../config/env');
const { ApiError } = require('../../../middlewares/errorHandler');

function signTokens(user) {
  // companyId may be a populated document (login populates it) or an ObjectId
  const claims = {
    sub: user._id.toString(),
    companyId: user.companyId ? String(user.companyId._id || user.companyId) : null,
    roleId: user.roleId ? String(user.roleId._id || user.roleId) : null,
  };
  return {
    accessToken: jwt.sign(claims, env.jwt.accessSecret, {
      expiresIn: env.jwt.accessExpiresIn,
    }),
    refreshToken: jwt.sign(claims, env.jwt.refreshSecret, {
      expiresIn: env.jwt.refreshExpiresIn,
    }),
  };
}

async function buildProfile(user) {
  const role = await Role.findById(user.roleId).lean();
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    // always the id string; the full company comes in the `company` field
    companyId: user.companyId ? String(user.companyId._id || user.companyId) : null,
    role: role ? { id: role._id.toString(), name: role.name, permissions: role.permissions } : null,
  };
}

/** POST /auth/login */
async function login({ email, password }) {
  const user = await User.findOne({ email, isActive: true })
    .select('+passwordHash')
    .populate('companyId', 'name taxId');

  if (!user) throw new ApiError(401, 'Invalid credentials');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new ApiError(401, 'Invalid credentials');

  const tokens = signTokens(user);
  return { ...tokens, user: await buildProfile(user), company: user.companyId || null };
}

/** POST /auth/refresh — rotates both tokens. */
async function refresh(refreshToken) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, env.jwt.refreshSecret);
  } catch (err) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const user = await User.findOne({ _id: payload.sub, isActive: true });
  if (!user) throw new ApiError(401, 'User is inactive or no longer exists');

  const tokens = signTokens(user);
  return { ...tokens, user: await buildProfile(user) };
}

module.exports = { login, refresh };
