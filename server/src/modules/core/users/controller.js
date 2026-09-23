'use strict';

const service = require('./service');

async function list(req, res, next) {
  try {
    // Super Admin (no company) can query any company via ?companyId=
    const companyId = req.query.companyId || req.user.companyId;
    const result = await service.list({ ...req.query, companyId });
    res.json(result);
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
    const user = await service.create(body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    res.json(await service.update(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update };
