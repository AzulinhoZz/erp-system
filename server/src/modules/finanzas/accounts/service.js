'use strict';

const Account = require('./model');
const { ApiError } = require('../../../middlewares/errorHandler');

async function list({ companyId, type, q, page = 1, limit = 50 }) {
  const query = {};
  if (companyId) query.companyId = companyId;
  if (type) query.type = type;
  if (q) {
    query.$or = [{ name: new RegExp(q, 'i') }, { code: new RegExp(q, 'i') }];
  }
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Account.find(query).sort({ code: 1 }).skip(skip).limit(Number(limit)),
    Account.countDocuments(query),
  ]);
  return { items, total, page: Number(page), limit: Number(limit) };
}

async function getById(id) {
  const account = await Account.findById(id);
  if (!account) throw new ApiError(404, 'Account not found');
  return account;
}

/** POST /accounts — code unique per company. */
async function create({ code, name, type, companyId }) {
  const dup = await Account.findOne({ companyId, code });
  if (dup) throw new ApiError(409, `Account code '${code}' already exists in this company`);
  return Account.create({ code, name, type, companyId });
}

async function update(id, data) {
  if (data.code || data.companyId) {
    const account = await Account.findById(id);
    if (!account) throw new ApiError(404, 'Account not found');
    if (data.code && data.code !== account.code) {
      const dup = await Account.findOne({ companyId: account.companyId, code: data.code });
      if (dup) throw new ApiError(409, `Account code '${data.code}' already exists`);
    }
  }
  const account = await Account.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!account) throw new ApiError(404, 'Account not found');
  return account;
}

module.exports = { list, getById, create, update };
