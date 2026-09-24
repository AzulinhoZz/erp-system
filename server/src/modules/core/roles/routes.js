'use strict';

const router = require('express').Router();
const controller = require('./controller');
const { authenticate } = require('../../../middlewares/auth');
const { authorize } = require('../../../middlewares/rbac');
const { validate } = require('../../../middlewares/validate');
const { createValidators, updateValidators } = require('./validators');
const { PERMISSIONS } = require('@erp/shared');

router.use(authenticate);
router.get('/', authorize(PERMISSIONS.ROLES_READ), controller.list);
router.get('/:id', authorize(PERMISSIONS.ROLES_READ), controller.getById);
router.post('/', createValidators, validate, authorize(PERMISSIONS.ROLES_WRITE), controller.create);
router.put('/:id', updateValidators, validate, authorize(PERMISSIONS.ROLES_WRITE), controller.update);

module.exports = router;
