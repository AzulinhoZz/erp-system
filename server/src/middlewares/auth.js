'use strict';

const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { ApiError } = require('./errorHandler');

/**
 * Verifies the Bearer access token and attaches the authenticated user
 * context (userId, companyId, roleId) to the request.
 *
 * Tenant safety rule: when a token belongs to a company, request-supplied
 * companyId values are never trusted. Controllers/services must use
 * req.user.companyId for tenant-owned data. This normalization also protects
 * older controllers that still read companyId from req.body/req.query.
 */
function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Authentication required'));
  }

  try {
    const payload = jwt.verify(token, env.jwt.accessSecret);
    req.user = {
      id: payload.sub,
      companyId: payload.companyId || null,
      roleId: payload.roleId || null,
    };

    if (req.user.companyId) {
      if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
        req.body.companyId = req.user.companyId;
      }
      if (req.query && typeof req.query === 'object') {
        req.query.companyId = req.user.companyId;
      }
    }

    return next();
  } catch (err) {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
}

module.exports = { authenticate };
