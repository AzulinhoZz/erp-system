'use strict';

const service = require('./service');
const { ApiError } = require('../../../middlewares/errorHandler');

async function login(req, res, next) {
  try {
    const result = await service.login(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const result = await service.refresh(req.body.refreshToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const User = require('../users/model');
    const user = await User.findById(req.user.id).populate('roleId', 'name permissions');
    if (!user) throw new ApiError(404, 'User not found');
    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      companyId: user.companyId,
      role: user.roleId,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, refresh, me };
