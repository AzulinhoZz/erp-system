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

async function update(req, res, next) {
  try {
    const supplier = await service.update(req.params.id, req.body);
    res.json(supplier);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update };
