'use strict';

const service = require('./service');

async function list(req, res, next) {
  try {
    const companyId = req.query.companyId || req.user.companyId;
    res.json(await service.list({ companyId }));
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    res.json(await service.getById(req.params.id, req.user.companyId));
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    res.status(201).json(await service.create(req.body, req.user.companyId));
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    res.json(await service.update(req.params.id, req.body, req.user.companyId));
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update };
