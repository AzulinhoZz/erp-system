'use strict';

const mongoose = require('mongoose');

/**
 * notifications — type, title, message, read, date (section 6 model).
 * companyId added for company-scoped broadcast alerts (e.g. stock.low).
 * Persisted first, then mirrored to Socket.io by the emitting service.
 */
const notificationSchema = new mongoose.Schema(
  {
    type: { type: String, default: 'info' }, // info | alert | success
    title: { type: String, required: true },
    message: { type: String, default: '' },
    read: { type: Boolean, default: false },
    date: { type: Date, default: Date.now },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  },
  { timestamps: true }
);

notificationSchema.index({ companyId: 1, date: -1 });
notificationSchema.index({ companyId: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
