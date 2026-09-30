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

async function markRead(req, res, next) {
  try {
    res.json(await service.markRead(req.params.id, requireTenant(req)));
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    res.json(await service.markAllRead(req.user.companyId));
  } catch (err) {
    next(err);
  }
}

module.exports = { list, markRead, markAllRead };
