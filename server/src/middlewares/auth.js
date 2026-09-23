'use strict';

const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { ApiError } = require('./errorHandler');

/**
 * Verifies the Bearer access token and attaches the authenticated user
 * context (userId, companyId, roleId) to the request.
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
    return next();
  } catch (err) {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
}

module.exports = { authenticate };
