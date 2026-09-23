'use strict';

const router = require('express').Router();
const controller = require('./controller');
const { validate } = require('../../../middlewares/validate');
const { loginValidators, refreshValidators } = require('./validators');
const { authenticate } = require('../../../middlewares/auth');

router.post('/login', loginValidators, validate, controller.login);
router.post('/refresh', refreshValidators, validate, controller.refresh);
router.get('/me', authenticate, controller.me);

module.exports = router;
