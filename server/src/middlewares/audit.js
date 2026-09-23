'use strict';

const { log } = require('../modules/notificaciones/auditLog/service');

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const SENSITIVE = /password|token|secret|hash/i;

/** Strip secrets and cap the size of the stored body summary. */
function summarize(body) {
  if (!body || typeof body !== 'object') return '';
  try {
    const clean = {};
    for (const [key, value] of Object.entries(body)) {
      clean[key] = SENSITIVE.test(key) ? '[redacted]' : value;
    }
    return JSON.stringify(clean).slice(0, 2000);
  } catch {
    return '';
  }
}

/** /api/v1/products/:id → products (empty for non-module paths like /auth). */
function entityFrom(path) {
  const parts = path.split('/');
  return parts[1] === 'api' && parts[3] ? parts[3] : '';
}

/**
 * audit — automatic trail middleware (approved approach).
 *
 * On every SUCCESSFUL mutating request (status < 400) it appends an
 * AuditLog entry with user, method, path, entity, status, IP and a
 * redacted body summary. Fire-and-forget: auditing never delays or
 * breaks the response. /auth/* is skipped (login flows, no business data).
 *
 * Mounted app-wide BEFORE routes so it can observe req.user (set later
 * by authenticate) at response 'finish' time.
 */
function audit(req, res, next) {
  if (!MUTATING.has(req.method)) return next();

  res.on('finish', () => {
    if (res.statusCode >= 400) return; // only successful operations
    if (req.path.startsWith('/auth')) return; // skip auth flows

    log({
      userId: req.user?.id || null,
      companyId: req.user?.companyId || null,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      entity: entityFrom(req.path),
      status: res.statusCode,
      ip: req.ip || req.socket?.remoteAddress || '',
      details: summarize(req.body),
    });
  });

  next();
}

module.exports = { audit };
