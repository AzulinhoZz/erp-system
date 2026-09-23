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

async function create(req, res, next) {
  try {
    res.status(201).json(await service.create(req.body));
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    res.json(await service.updateStatus(req.params.id, req.body.status));
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, updateStatus };
