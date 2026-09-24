'use strict';

const { ApiError } = require('./errorHandler');

function requireTenant(req) {
  if (!req.user || !req.user.companyId) {
    throw new ApiError(403, 'Company context required');
  }
  return String(req.user.companyId);
}

function tenantQuery(req) {
  return { companyId: requireTenant(req) };
}

module.exports = { requireTenant, tenantQuery };
