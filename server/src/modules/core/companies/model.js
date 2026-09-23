'use strict';

const mongoose = require('mongoose');

/**
 * companies — name, taxId, settings.
 * Root of multi-tenancy: every scoped entity references a companyId.
 */
const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    taxId: { type: String, required: true, unique: true, trim: true },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', companySchema);
