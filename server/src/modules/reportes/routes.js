'use strict';

const router = require('express').Router();
const controller = require('./controller');
const { authenticate } = require('../../middlewares/auth');
const { authorize } = require('../../middlewares/rbac');
const { validate } = require('../../middlewares/validate');
const { dateValidators, summaryValidators } = require('./validators');
const { PERMISSIONS } = require('@erp/shared');

router.use(authenticate);
router.use(authorize(PERMISSIONS.REPORTS_READ));

// Read-only aggregations (no model of their own — no new collections).
router.get('/inventory/stock', dateValidators, validate, controller.inventoryStock);
router.get('/sales/summary', dateValidators, validate, controller.salesSummary);
router.get('/purchases/summary', dateValidators, validate, controller.purchasesSummary);
router.get('/payroll/summary', summaryValidators, validate, controller.payrollSummary);
router.get('/finance/trial-balance', dateValidators, validate, controller.trialBalance);

module.exports = router;
