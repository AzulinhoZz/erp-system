'use strict';

const mongoose = require('mongoose');
const Payroll = require('./model');
const Employee = require('../employees/model');
const { ApiError } = require('../../../middlewares/errorHandler');

async function list({ period, page = 1, limit = 50 }) {
  const query = {};
  if (period) query.period = period;
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Payroll.find(query)
      .populate('employeeId', 'name position')
      .sort({ period: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Payroll.countDocuments(query),
  ]);
  return { items, total, page: Number(page), limit: Number(limit) };
}

/**
 * POST /payroll/run — procesa un periodo completo en UNA transacción.
 *
 * Para cada empleado activo (isActive: true):
 *   grossPay   = salary  (se copia el Decimal128 tal cual, sin convertir a
 *                Number, para no perder precisión)
 *   deductions = 0.00
 *   netPay     = grossPay  (igual a grossPay porque deductions es 0)
 *
 * TODO: deductions fijas en 0, falta definir reglas de impuestos/descuentos
 *
 * Si ya existe payroll para algún employeeId+period:
 *   - skipExisting=false (default): lanza 409 con la lista de duplicados
 *   - skipExisting=true: los omite y procesa solo los pendientes
 */
async function run({ period, branchId, skipExisting = false }) {
  if (!/^\d{4}-\d{2}$/.test(period || '')) {
    throw new ApiError(400, "period debe tener formato 'YYYY-MM' (ej. 2026-09)");
  }

  const filter = { isActive: true };
  if (branchId) filter.branchId = branchId;
  const employees = await Employee.find(filter);
  if (!employees.length) {
    throw new ApiError(404, 'No hay empleados activos para procesar');
  }

  const existing = await Payroll.find({
    period,
    employeeId: { $in: employees.map((e) => e._id) },
  }).populate('employeeId', 'name');

  if (existing.length && !skipExisting) {
    const names = existing.map((p) => p.employeeId?.name || p.employeeId).join(', ');
    throw new ApiError(
      409,
      `Ya existe payroll del periodo ${period} para: ${names}. ` +
        `Envía skipExisting=true para omitirlos y procesar solo los pendientes.`
    );
  }

  const paidIds = new Set(existing.map((p) => String(p.employeeId?._id || p.employeeId)));
  const pending = employees.filter((e) => !paidIds.has(String(e._id)));
  if (!pending.length) {
    return { period, created: 0, skipped: employees.length, entries: [] };
  }

  const zero = mongoose.Types.Decimal128.fromString('0.00');
  const session = await mongoose.startSession();
  try {
    let entries = [];
    await session.withTransaction(async () => {
      const docs = pending.map((employee) => ({
        employeeId: employee._id,
        period,
        grossPay: employee.salary, // Decimal128 copiado directo, sin pasar por Number
        deductions: zero,
        netPay: employee.salary,
      }));
      entries = await Payroll.create(docs, { session });
    });

    return {
      period,
      created: entries.length,
      skipped: employees.length - pending.length,
      entries,
    };
  } finally {
    session.endSession();
  }
}

module.exports = { list, run };