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

/** POST /payroll/run — process a whole period (idempotent, transactional). */
async function run(req, res, next) {
  try {
    const companyId = req.body.companyId || req.user.companyId;
    const result = await service.run({ ...req.body, companyId });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, run };
