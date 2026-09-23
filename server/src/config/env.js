'use strict';

/**
 * Centralized environment configuration.
 * All env vars are read here — never use process.env outside this file.
 */
require('dotenv').config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGO_URI || '',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || '',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:19006,http://localhost:8081')
    .split(',')
    .map((o) => o.trim()),
};

/** Fail fast when a required variable is missing. */
function validateEnv() {
  const required = ['mongoUri', 'jwt.accessSecret', 'jwt.refreshSecret'];
  const missing = required.filter((key) => {
    const value = key.split('.').reduce((obj, part) => obj && obj[part], env);
    return !value;
  });
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = { env, validateEnv };
