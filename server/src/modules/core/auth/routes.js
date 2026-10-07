'use strict';

const router = require('express').Router();
const controller = require('./controller');
const { validate } = require('../../../middlewares/validate');
const { loginValidators, refreshValidators, switchCompanyValidators } = require('./validators');
const { authenticate } = require('../../../middlewares/auth');

router.post('/login', loginValidators, validate, controller.login);
router.post('/refresh', refreshValidators, validate, controller.refresh);
router.post('/switch-company', authenticate, switchCompanyValidators, validate, controller.switchCompany);
router.get('/me', authenticate, controller.me);

module.exports = router;
