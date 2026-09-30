'use strict';

const mongoose = require('mongoose');
const { ApiError } = require('./errorHandler');

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
      req.authz = { role };
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

function isPlatformRole(role) {
  return Boolean(role && (role.isPlatform === true || role.permissions?.includes('*') || role.name === 'Super Admin'));
}

function forbidPlatformRoleMutation(req, _res, next) {
  const role = req.authz?.role;
  const isCompanyAdmin = role && role.name === 'Admin' && !isPlatformRole(role);
  if (!isCompanyAdmin) return next();

  const requestedPermissions = req.body?.permissions || [];
  const requestedName = req.body?.name;

  if (requestedPermissions.includes('*') || requestedName === 'Super Admin' || req.body?.isPlatform === true) {
    return next(new ApiError(403, 'Company Admin cannot create or assign platform roles'));
  }

  return next();
}

module.exports = { authorize, invalidateRoleCache, isPlatformRole, forbidPlatformRoleMutation };
