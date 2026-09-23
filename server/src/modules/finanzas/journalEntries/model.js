'use strict';

const mongoose = require('mongoose');

/**
 * journalEntries — date, lines[{accountId, debit (Decimal128),
 * credit (Decimal128)}], reference.
 * Double-entry rule enforced in the service: Σdebit == Σcredit.
 * Lines are immutable after creation (accounting audit trail).
 */
const journalEntrySchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    lines: [
      {
        accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
        debit: { type: mongoose.Schema.Types.Decimal128, required: true, default: '0' },
        credit: { type: mongoose.Schema.Types.Decimal128, required: true, default: '0' },
        _id: false,
      },
    ],
    reference: { type: String, default: '' },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  },
  { timestamps: true }
);

journalEntrySchema.index({ companyId: 1, date: -1 });

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
