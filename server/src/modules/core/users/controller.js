'use strict';

const service = require('./service');
const { requireTenant } = require('../../../middlewares/tenantScope');

async function list(req, res, next) {
  try {
    const companyId = requireTenant(req);
    const result = await service.list({ ...req.query, companyId });
    res.json(result);
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
    res.status(201).json(await service.create(body, req.user));
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { companyId } = req.user;
    const body = { ...req.body };
    delete body.companyId;
    res.json(await service.update(req.params.id, body, requireTenant(req)));
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update };
