'use strict';

const { requireTenant } = require('../../../middlewares/tenantScope');

const service = require('./service');

async function list(req, res, next) {
  try {
    res.json(await service.list({ ...req.query, companyId: requireTenant(req) }));
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

module.exports = { list, create };
