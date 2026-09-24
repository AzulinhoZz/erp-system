'use strict';

const service = require('./service');
const { ApiError } = require('../../../middlewares/errorHandler');

function assertCompanyAdminCannotTouchPlatform(req) {
  const role = req.authz?.role;
  const isCompanyAdmin = role?.name === 'Admin' && role?.permissions?.includes('*') !== true && role?.isPlatform !== true;
  if (!isCompanyAdmin) return;
  const body = req.body || {};
  if (body.permissions?.includes('*') || body.name === 'Super Admin' || body.isPlatform === true) {
    throw new ApiError(403, 'Company Admin cannot create or modify platform roles');
  }
}

async function list(_req, res, next) {
  try { res.json(await service.list()); } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try { res.json(await service.getById(req.params.id)); } catch (err) { next(err); }
}

async function create(req, res, next) {
  try { assertCompanyAdminCannotTouchPlatform(req); res.status(201).json(await service.create(req.body)); } catch (err) { next(err); }
}

async function update(req, res, next) {
  try { assertCompanyAdminCannotTouchPlatform(req); res.json(await service.update(req.params.id, req.body)); } catch (err) { next(err); }
}

module.exports = { list, getById, create, update };
