'use strict';

const { env } = require('../config/env');

const SENSITIVE = new Set(['password', 'passwordHash', 'token', 'refreshToken']);

function redact(body) {
  if (!body || typeof body !== 'object') return body;
  const clone = { ...body };
  for (const key of Object.keys(clone)) {
    if (SENSITIVE.has(key)) clone[key] = '[REDACTED]';
  }
  return clone;
}

/** Lightweight request logger (method, url, status, duration, user). */
function logger(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    if (env.nodeEnv === 'test') return;
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const user = req.user ? req.user.id : '-';
    console.log(
      `[api] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms user=${user}` +
        (req.method === 'POST' || req.method === 'PUT' ? ` body=${JSON.stringify(redact(req.body))}` : '')
    );
  });
  next();
}

module.exports = { logger };
