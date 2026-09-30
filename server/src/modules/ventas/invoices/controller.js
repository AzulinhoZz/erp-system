'use strict';

const { requireTenant } = require('../../../middlewares/tenantScope');

const service = require('./service');

async function list(req, res, next) {
  try {
    const companyId = requireTenant(req);
    res.json(await service.list({ ...req.query, companyId }));
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    res.status(201).json(await service.create({ ...req.body, companyId: requireTenant(req) }));
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    res.json(await service.updateStatus(req.params.id, req.body.status, requireTenant(req)));
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, updateStatus };
