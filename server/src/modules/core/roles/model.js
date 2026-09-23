'use strict';

const mongoose = require('mongoose');

/**
 * roles — name, permissions[].
 * permissions use "resource:action" strings (e.g. "products:create").
 * A single "*" grants full access (Super Admin).
 */
const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    permissions: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Role', roleSchema);
