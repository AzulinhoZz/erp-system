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

async function getById(req, res, next) {
  try {
    res.json(await service.getById(req.params.id));
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const body = { ...req.body };
    if (!body.companyId) body.companyId = req.user.companyId;
    res.status(201).json(await service.create(body));
  } catch (err) {
    next(err);
  }
}

/** POST /purchase-orders/:id/receive — integrate with inventory. */
async function receive(req, res, next) {
  try {
    res.json(await service.receive(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, receive };
