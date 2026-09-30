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

async function getById(req, res, next) {
  try {
    res.json(await service.getById(req.params.id, requireTenant(req)));
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const body = { ...req.body, companyId: requireTenant(req) };
    body.companyId = requireTenant(req);
    res.status(201).json(await service.create(body));
  } catch (err) {
    next(err);
  }
}

/** POST /sales-orders/:id/confirm — validates stock + credit, moves stock. */
async function confirm(req, res, next) {
  try {
    res.json(await service.confirm(req.params.id, { ...req.body, companyId: requireTenant(req) }));
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, confirm };
