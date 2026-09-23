'use strict';

const Invoice = require('../ventas/invoices/model');
const PurchaseOrder = require('../compras/purchaseOrders/model');
const Product = require('../inventario/products/model');
const Payroll = require('../rrhh/payroll/model');
const JournalEntry = require('../finanzas/journalEntries/model');
const Account = require('../finanzas/accounts/model');
const { ApiError } = require('../../middlewares/errorHandler');
const mongoose = require('mongoose');

/**
 * Aggregations bypass Mongoose casting: a $match on companyId needs a real
 * ObjectId (find/countDocuments cast the string automatically — that's why
 * plain queries worked). Normalize once per report.
 */
function oid(id) {
  if (!id) return id;
  return mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(String(id)) : id;
}

/** Aggregations return BSON Decimal128 → convert before sending JSON. */
function dec(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return Number(value.toString()) || 0;
}

function parseRange(from, to) {
  const start = from ? new Date(from) : null;
  const end = to ? new Date(to) : null;
  if (start && Number.isNaN(start.getTime())) throw new ApiError(400, 'Invalid from date');
  if (end && Number.isNaN(end.getTime())) throw new ApiError(400, 'Invalid to date');
  return { start, end };
}

function dateFilter(field, { start, end }) {
  const filter = {};
  if (start || end) {
    filter[field] = {};
    if (start) filter[field].$gte = start;
    if (end) {
      const dayEnd = new Date(end);
      dayEnd.setHours(23, 59, 59, 999);
      filter[field].$lte = dayEnd;
    }
  }
  return filter;
}

/** 1) GET /reports/inventory/stock — current stock + low-stock list. */
async function inventoryStock({ companyId }) {
  const cid = oid(companyId);
  const query = cid ? { companyId: cid } : {};
  const [totalSkus, agg, low] = await Promise.all([
    Product.countDocuments(query),
    Product.aggregate([
      { $match: query },
      // inventory value = Σ(stock × unit cost) — Decimal128 × number stays Decimal128
      { $group: { _id: null, units: { $sum: '$stock' }, value: { $sum: { $multiply: ['$stock', '$cost'] } } } },
    ]),
    // $expr compares two document fields (stock <= minStock)
    Product.find({
      ...query,
      minStock: { $gt: 0 },
      $expr: { $lte: ['$stock', '$minStock'] },
    })
      .sort({ stock: 1 })
      .limit(50),
  ]);

  return {
    totalSkus,
    totalUnits: agg[0]?.units || 0,
    inventoryValue: dec(agg[0]?.value),
    lowStock: low.map((p) => ({
      id: p._id,
      sku: p.sku,
      name: p.name,
      stock: p.stock,
      minStock: p.minStock,
    })),
  };
}

/** 2) GET /reports/sales/summary?from&to — invoiced sales by day/status. */
async function salesSummary({ companyId, from, to }) {
  const range = parseRange(from, to);
  const match = { ...dateFilter('createdAt', range) };
  if (companyId) match.companyId = oid(companyId);

  const [byStatus, byDay] = await Promise.all([
    Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$amount' },
        },
      },
    ]),
    Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    byStatus: byStatus.map((r) => ({ status: r._id, count: r.count, total: dec(r.total) })),
    byDay: byDay.map((r) => ({ date: r._id, count: r.count, total: dec(r.total) })),
    total: byStatus.reduce((s, r) => s + dec(r.total), 0),
    count: byStatus.reduce((s, r) => s + r.count, 0),
  };
}

/** 3) GET /reports/purchases/summary?from&to — received POs by supplier. */
async function purchasesSummary({ companyId, from, to }) {
  const range = parseRange(from, to);
  const match = { status: 'received', ...dateFilter('date', range) };
  if (companyId) match.companyId = oid(companyId);

  const bySupplier = await PurchaseOrder.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'suppliers',
        localField: 'supplierId',
        foreignField: '_id',
        as: 'supplier',
      },
    },
    { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$supplierId',
        name: { $first: '$supplier.name' },
        count: { $sum: 1 },
        total: { $sum: '$total' },
      },
    },
    { $sort: { total: -1 } },
  ]);

  return {
    bySupplier: bySupplier.map((r) => ({
      supplierId: r._id,
      name: r.name || 'Proveedor eliminado',
      count: r.count,
      total: dec(r.total),
    })),
    total: bySupplier.reduce((s, r) => s + dec(r.total), 0),
    count: bySupplier.reduce((s, r) => s + r.count, 0),
  };
}

/** 4) GET /reports/payroll/summary?period — totals for a period. */
async function payrollSummary({ companyId, period }) {
  if (!period) throw new ApiError(400, "period is required, e.g. ?period=2026-09");
  const match = { period };
  if (companyId) match.companyId = oid(companyId);

  const [agg, byEmployee] = await Promise.all([
    Payroll.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          gross: { $sum: '$grossPay' },
          deductions: { $sum: '$deductions' },
          net: { $sum: '$netPay' },
        },
      },
    ]),
    Payroll.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'employees',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee',
        },
      },
      { $unwind: { path: '$employee', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: '$employee.name',
          position: '$employee.position',
          grossPay: 1,
          deductions: 1,
          netPay: 1,
        },
      },
      { $sort: { name: 1 } },
    ]),
  ]);

  return {
    period,
    count: agg[0]?.count || 0,
    gross: dec(agg[0]?.gross),
    deductions: dec(agg[0]?.deductions),
    net: dec(agg[0]?.net),
    byEmployee: byEmployee.map((r) => ({
      name: r.name || 'Empleado eliminado',
      position: r.position || '',
      grossPay: dec(r.grossPay),
      deductions: dec(r.deductions),
      netPay: dec(r.netPay),
    })),
  };
}

/** 5) GET /reports/finance/trial-balance?from&to — Σdebe − Σhaber per account. */
async function trialBalance({ companyId, from, to }) {
  const range = parseRange(from, to);
  const match = { ...dateFilter('date', range) };
  if (companyId) match.companyId = oid(companyId);

  const rows = await JournalEntry.aggregate([
    { $match: match },
    { $unwind: '$lines' },
    {
      $group: {
        _id: '$lines.accountId',
        debit: { $sum: '$lines.debit' },
        credit: { $sum: '$lines.credit' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const accounts = await Account.find({ _id: { $in: rows.map((r) => r._id) } });
  const byId = new Map(accounts.map((a) => [String(a._id), a]));

  const lines = rows.map((r) => {
    const account = byId.get(String(r._id));
    const debit = dec(r.debit);
    const credit = dec(r.credit);
    return {
      accountId: r._id,
      code: account?.code || '?',
      name: account?.name || 'Cuenta eliminada',
      type: account?.type || '',
      debit,
      credit,
      balance: Math.round((debit - credit) * 100) / 100,
    };
  });

  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);

  return {
    lines,
    totalDebit: Math.round(totalDebit * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
    balanced: Math.abs(totalDebit - totalCredit) < 0.005,
  };
}

module.exports = { inventoryStock, salesSummary, purchasesSummary, payrollSummary, trialBalance };
