'use strict';

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

let io = null;

/**
 * Socket.io setup. Clients authenticate with the access token:
 *   io(url, { auth: { token } })
 * Each user joins a personal room `user:<id>` and a company room
 * `company:<companyId>` so modules can emit targeted notifications
 * (e.g. low stock → purchasing alert).
 */
function initSockets(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.corsOrigins, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      const payload = jwt.verify(token, env.jwt.accessSecret);
      socket.user = { id: payload.sub, companyId: payload.companyId || null };
      next();
    } catch (err) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const { id, companyId } = socket.user;
    socket.join(`user:${id}`);
    if (companyId) socket.join(`company:${companyId}`);

    socket.on('disconnect', () => {
      /* rooms are cleaned automatically */
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io has not been initialized');
  return io;
}

/** Emit a notification to a single user (creates nothing in DB — see services). */
function notifyUser(userId, notification) {
  getIO().to(`user:${userId}`).emit('notification', notification);
}

/** Emit a business event to everyone in a company (e.g. stock.low). */
function emitToCompany(companyId, event, payload) {
  getIO().to(`company:${companyId}`).emit(event, payload);
}

module.exports = { initSockets, getIO, notifyUser, emitToCompany };
