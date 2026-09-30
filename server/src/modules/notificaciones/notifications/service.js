'use strict';

const mongoose = require('mongoose');
const Notification = require('./model');
const { ApiError } = require('../../../middlewares/errorHandler');

/**
 * createNotification — persists a notification and (best effort) never
 * throws: notifications must not break the business flow that triggered them.
 */
async function createNotification({ companyId, type, title, message }) {
  try {
    return await Notification.create({
      companyId,
      type: type || 'info',
      title,
      message,
      read: false,
      date: new Date(),
    });
  } catch (err) {
    console.warn('[notificaciones] could not persist notification:', err.message);
    return null;
  }
}

async function list({ companyId, unreadOnly, page = 1, limit = 30 }) {
  const query = {};
  if (companyId) query.companyId = companyId;
  if (unreadOnly === 'true' || unreadOnly === true) query.read = false;
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

  const [items, total, unread] = await Promise.all([
    Notification.find(query).sort({ date: -1 }).skip(skip).limit(Number(limit)),
    Notification.countDocuments(query),
    companyId ? Notification.countDocuments({ companyId, read: false }) : Promise.resolve(0),
  ]);
  return { items, total, unread, page: Number(page), limit: Number(limit) };
}

async function markRead(id, companyId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, companyId },
    { read: true },
    { new: true }
  );
  if (!notification) throw new ApiError(404, 'Notification not found');
  return notification;
}

async function markAllRead(companyId) {
  const result = await Notification.updateMany(
    { ...(companyId && { companyId }), read: false },
    { read: true }
  );
  return { modified: result.modifiedCount };
}

module.exports = { createNotification, list, markRead, markAllRead };
