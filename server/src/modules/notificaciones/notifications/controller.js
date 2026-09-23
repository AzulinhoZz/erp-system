'use strict';

const service = require('./service');

async function list(req, res, next) {
  try {
    const companyId = req.query.companyId || req.user.companyId;
    res.json(await service.list({ ...req.query, companyId }));
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    res.json(await service.markRead(req.params.id));
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
