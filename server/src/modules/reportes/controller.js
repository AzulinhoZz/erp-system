'use strict';

const { requireTenant } = require('../../../middlewares/tenantScope');

const service = require('./service');

function scoped(req) {
  return { ...req.query, companyId: requireTenant(req) };
}

async function inventoryStock(req, res, next) {
  try {
    res.json(await service.inventoryStock(scoped(req)));
  } catch (err) {
    next(err);
  }
}

async function salesSummary(req, res, next) {
  try {
    res.json(await service.salesSummary(scoped(req)));
  } catch (err) {
    next(err);
  }
}

async function purchasesSummary(req, res, next) {
  try {
    res.json(await service.purchasesSummary(scoped(req)));
  } catch (err) {
    next(err);
  }
}

async function payrollSummary(req, res, next) {
  try {
    res.json(await service.payrollSummary(scoped(req)));
  } catch (err) {
    next(err);
  }
}

async function trialBalance(req, res, next) {
  try {
    res.json(await service.trialBalance(scoped(req)));
  } catch (err) {
    next(err);
  }
}

module.exports = { inventoryStock, salesSummary, purchasesSummary, payrollSummary, trialBalance };
