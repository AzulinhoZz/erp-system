'use strict';

const AuditLog = require('./model');
const { ApiError } = require('../../../middlewares/errorHandler');

/**
 * log — fire-and-forget write called by middlewares/audit.js.
 * Never throws: auditing must not break a successful business response.
 */
async function log(entry) {
  try {
    return await AuditLog.create(entry);
  } catch (err) {
    console.warn('[audit] could not persist log:', err.message);
    return null;
  }
}

async function list({ companyId, entity, page = 1, limit = 50 }) {
  const query = {};
  if (companyId) query.companyId = companyId;
  if (entity) query.entity = entity;
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    AuditLog.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    AuditLog.countDocuments(query),
  ]);
  return { items, total, page: Number(page), limit: Number(limit) };
}

module.exports = { log, list };
