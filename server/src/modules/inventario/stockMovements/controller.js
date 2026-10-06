'use strict';

const service = require('./service');

async function list(req, res, next) {
  try {
    res.json(await service.list({ ...req.query, companyId: req.user.companyId }));
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    res.status(201).json(await service.create({ ...req.body, companyId: req.user.companyId }));
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create };
