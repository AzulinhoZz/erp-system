'use strict';

const mongoose = require('mongoose');

/**
 * auditLogs — automatic trail written by middlewares/audit.js on every
 * successful mutating request (POST/PUT/PATCH/DELETE).
 * Append-only: there is no update/delete endpoint on purpose.
 */
const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    method: { type: String, required: true },
    path: { type: String, required: true }, // e.g. /api/v1/products/:id
    entity: { type: String, default: '' },  // e.g. 'products'
    status: { type: Number, required: true },
    ip: { type: String, default: '' },
    details: { type: String, default: '' }, // redacted body summary (≤2000 chars)
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  },
  { timestamps: true }
);

auditLogSchema.index({ companyId: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
