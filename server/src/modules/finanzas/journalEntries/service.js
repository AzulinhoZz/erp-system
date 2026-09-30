'use strict';

const JournalEntry = require('./model');
const Account = require('../accounts/model');
const Company = require('../../core/companies/model');
const { ApiError } = require('../../../middlewares/errorHandler');

function toNum(decimal) {
  if (decimal === null || decimal === undefined) return 0;
  if (typeof decimal === 'number') return decimal;
  if (typeof decimal === 'string') return Number(decimal) || 0;
  return Number(decimal.toString()) || 0; // Decimal128 has toString()
}

/**
 * Double-entry validation: at least 2 lines, one debit and one credit,
 * and Σdebit == Σcredit (penny tolerance).
 */
function assertBalanced(lines) {
  if (!Array.isArray(lines) || lines.length < 2) {
    throw new ApiError(400, 'A journal entry needs at least 2 lines');
  }
  let totalDebit = 0;
  let totalCredit = 0;
  lines.forEach((line, i) => {
    const debit = Number(line.debit || 0);
    const credit = Number(line.credit || 0);
    if (Number.isNaN(debit) || Number.isNaN(credit)) {
      throw new ApiError(400, `Line ${i + 1}: debit/credit must be numbers`);
    }
    if (debit < 0 || credit < 0) {
      throw new ApiError(400, `Line ${i + 1}: amounts cannot be negative`);
    }
    if (debit > 0 && credit > 0) {
      throw new ApiError(400, `Line ${i + 1}: a line cannot have both debit and credit`);
    }
    if (debit === 0 && credit === 0) {
      throw new ApiError(400, `Line ${i + 1}: must have a debit or a credit amount`);
    }
    totalDebit += debit;
    totalCredit += credit;
  });
  if (Math.abs(totalDebit - totalCredit) > 0.005) {
    throw new ApiError(
      400,
      `Entry does not balance: debit ${totalDebit.toFixed(2)} ≠ credit ${totalCredit.toFixed(2)}`
    );
  }
  return totalDebit.toFixed(2);
}

async function list({ companyId, page = 1, limit = 20 }) {
  const query = {};
  if (companyId) query.companyId = companyId;
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    JournalEntry.find(query)
      .populate('lines.accountId', 'code name type')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit)),
    JournalEntry.countDocuments(query),
  ]);
  return { items, total, page: Number(page), limit: Number(limit) };
}

async function getById(id, companyId) {
  const entry = await JournalEntry.findOne({ _id: id, companyId }).populate('lines.accountId', 'code name type');
  if (!entry) throw new ApiError(404, 'Journal entry not found');
  return entry;
}

/** POST /journal-entries — manual entry, must balance, accounts in-company. */
async function create({ date, lines, reference, companyId }) {
  assertBalanced(lines);

  const accountIds = [...new Set(lines.map((l) => String(l.accountId)))];
  const accounts = await Account.find({ _id: { $in: accountIds }, companyId });
  if (accounts.length !== accountIds.length) {
    throw new ApiError(400, 'Every accountId must exist inside your company chart of accounts');
  }

  return JournalEntry.create({
    date: date || new Date(),
    lines,
    reference: reference || '',
    companyId,
  });
}

/**
 * postAutomaticEntry — used by OTHER modules inside their own transaction.
 *
 * Resolves account codes from company.settings.defaultAccounts:
 *   { inventory, accountsReceivable, accountsPayable, salesRevenue }
 * Returns null (with a warning) when the company hasn't configured them yet,
 * so business flows never break because accounting isn't set up.
 *
 * Usage: await postAutomaticEntry({ session, companyId, debitKey, creditKey, amount, reference })
 */
async function postAutomaticEntry({ session, companyId, debitKey, creditKey, amount, date, reference }) {
  const company = await Company.findById(companyId).session(session || null);
  const defaults = company?.settings?.defaultAccounts || {};

  const debitCode = defaults[debitKey];
  const creditCode = defaults[creditKey];
  if (!debitCode || !creditCode) {
    console.warn(
      `[finanzas] auto entry skipped for company ${companyId}: ` +
        `settings.defaultAccounts.${debitKey}/${creditKey} not configured`
    );
    return null;
  }

  const [debitAccount, creditAccount] = await Promise.all([
    Account.findOne({ companyId, code: debitCode }).session(session || null),
    Account.findOne({ companyId, code: creditCode }).session(session || null),
  ]);
  if (!debitAccount || !creditAccount) {
    console.warn(
      `[finanzas] auto entry skipped for company ${companyId}: ` +
        `accounts ${debitCode}/${creditCode} not found`
    );
    return null;
  }

  const value = Number(amount).toFixed(2);
  const [entry] = await JournalEntry.create(
    [
      {
        date: date || new Date(),
        reference: reference || '',
        companyId,
        lines: [
          { accountId: debitAccount._id, debit: value, credit: '0' },
          { accountId: creditAccount._id, debit: '0', credit: value },
        ],
      },
    ],
    { session }
  );
  return entry;
}

module.exports = { list, getById, create, postAutomaticEntry, assertBalanced };
