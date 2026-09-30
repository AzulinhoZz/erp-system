'use strict';

const Attendance = require('./model');
const Employee = require('../employees/model');
const { ApiError } = require('../../../middlewares/errorHandler');

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function list({ companyId, date, employeeId, page = 1, limit = 50 }) {
  const query = {};
  if (employeeId) query.employeeId = employeeId;
  if (date) {
    const day = startOfDay(date);
    query.date = { $gte: day, $lt: new Date(day.getTime() + 86400000) };
  }
  if (companyId) {
    const employees = await Employee.find({ companyId }).select('_id');
    query.employeeId = { $in: employees.map((e) => e._id) };
  }
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Attendance.find(query)
      .populate('employeeId', 'name position')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Attendance.countDocuments(query),
  ]);
  return { items, total, page: Number(page), limit: Number(limit) };
}

/**
 * POST /attendance — check-in for a day.
 * Upsert-style: re-posting the same day updates the marks instead of
 * failing on the unique (employeeId, date) index.
 */
async function create({ employeeId, date, checkIn, checkOut, companyId }) {
  const employee = await Employee.findOne({ _id: employeeId, companyId });
  if (!employee) throw new ApiError(404, 'Employee not found');

  const day = startOfDay(date || new Date());
  const existing = await Attendance.findOne({ employeeId, date: day });
  if (existing) {
    if (checkIn !== undefined) existing.checkIn = checkIn;
    if (checkOut !== undefined) existing.checkOut = checkOut;
    await existing.save();
    return existing;
  }
  return Attendance.create({
    employeeId,
    companyId: companyId || employee.companyId,
    date: day,
    checkIn: checkIn || '',
    checkOut: checkOut || '',
  });
}

/** PUT /attendance/:id — close the shift (checkOut). */
async function update(id, data, companyId) {
  const allowed = {};
  if (data.checkIn !== undefined) allowed.checkIn = data.checkIn;
  if (data.checkOut !== undefined) allowed.checkOut = data.checkOut;
  const record = await Attendance.findOneAndUpdate({ _id: id, companyId }, allowed, {
    new: true,
    runValidators: true,
  });
  if (!record) throw new ApiError(404, 'Attendance record not found');
  return record;
}

module.exports = { list, create, update };
