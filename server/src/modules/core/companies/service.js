'use strict';

const Company = require('./model');
const { ApiError } = require('../../../middlewares/errorHandler');

async function list() {
  return Company.find().sort({ name: 1 });
}

async function getById(id) {
  const company = await Company.findById(id);
  if (!company) throw new ApiError(404, 'Company not found');
  return company;
}

async function create(data) {
  return Company.create(data);
}

async function update(id, data) {
  const company = await Company.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!company) throw new ApiError(404, 'Company not found');
  return company;
}

module.exports = { list, getById, create, update };
