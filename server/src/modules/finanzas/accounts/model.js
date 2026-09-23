'use strict';

const mongoose = require('mongoose');
const { ACCOUNT_TYPES } = require('@erp/shared');

/**
 * accounts — code, name, type (activo/pasivo/capital/ingreso/gasto).
 * Chart of accounts is PER COMPANY (companyId) — code is unique per company.
 * type stays in Spanish because it mirrors the accounting categories of the
 * project's documentation (section 6 of the data model).
 */
const accountSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ACCOUNT_TYPES, required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  },
  { timestamps: true }
);

accountSchema.index({ companyId: 1, code: 1 }, { unique: true });
accountSchema.index({ companyId: 1, type: 1 });

module.exports = mongoose.model('Account', accountSchema);
