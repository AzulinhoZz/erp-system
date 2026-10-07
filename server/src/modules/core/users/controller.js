'use strict';

const service = require('./service');

function actor(req) {
  return {
    userId: req.user.id,
    companyId: req.user.companyId,
    roleId: req.user.roleId,
  };
}

async function list(req, res, next) {
  try {
    const companyId = req.user.companyId || req.query.companyId;
    const result = await service.list({ ...req.query, companyId });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    res.json(await service.getById(req.params.id, actor(req)));
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const user = await service.create(req.body, actor(req));
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    res.json(await service.update(req.params.id, req.body, actor(req)));
  } catch (err) {
    next(err);
  }
}

async function deactivate(req, res, next) {
  try {
    res.json(await service.deactivate(req.params.id, actor(req)));
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, deactivate };
