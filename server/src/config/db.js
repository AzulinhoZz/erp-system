'use strict';

const mongoose = require('mongoose');
const { env } = require('./env');

/** Connect to MongoDB Atlas with sensible pool/retry defaults. */
async function connectDb() {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    console.log('[db] connected to MongoDB Atlas');
  });
  mongoose.connection.on('error', (err) => {
    console.error('[db] connection error:', err.message);
  });

  await mongoose.connect(env.mongoUri, {
    autoIndex: env.nodeEnv !== 'production',
  });
}

async function disconnectDb() {
  await mongoose.connection.close();
}

module.exports = { connectDb, disconnectDb };
