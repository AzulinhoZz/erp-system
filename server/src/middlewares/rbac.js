'use strict';

const mongoose = require('mongoose');
const { ApiError } = require('./errorHandler');

/** Tiny in-memory cache so we don't hit the roles collection on every request. */
const roleCache = new Map();
const CACHE_TTL_MS = 60_000;

async function getRole(roleId) {
  const cached = roleCache.get(roleId);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.role;

  const Role = mongoose.model('Role');
  const role = await Role.findById(roleId).lean();
  roleCache.set(roleId, { role, at: Date.now() });
  return role;
}

function invalidateRoleCache(roleId) {
  if (roleId) roleCache.delete(roleId);
  else roleCache.clear();
}

/**
 * RBAC middleware factory: authorize('users:create') or authorize(['a','b']).
 * Permissions are validated against the role stored in the database,
 * never hardcoded per route.
 */
function authorize(required) {
  const requiredPerms = Array.isArray(required) ? required : [required];

  return async function rbac(req, _res, next) {
    try {
      if (!req.user) return next(new ApiError(401, 'Authentication required'));
      if (!req.user.roleId) return next(new ApiError(403, 'Role not assigned'));

      const role = await getRole(req.user.roleId);
      if (!role) return next(new ApiError(403, 'Role not found'));

      const perms = role.permissions || [];
      const allowed =
        requiredPerms[0] === '*' || requiredPerms.every((p) => perms.includes(p) || perms.includes('*'));

      if (!allowed) return next(new ApiError(403, 'Insufficient permissions'));
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = { authorize, invalidateRoleCache };
