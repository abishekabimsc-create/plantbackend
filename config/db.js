const mongoose = require('mongoose');
const { mongoUri } = require('./env');

mongoose.set('strictQuery', true);

/**
 * Opens the MongoDB connection. Rejects (rather than exiting) so the caller
 * can decide how to report the failure.
 */
async function connectDatabase() {
  const connection = await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  mongoose.connection.on('error', (error) => {
    console.error('[mongo] connection error:', error.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[mongo] disconnected');
  });

  return connection;
}

async function disconnectDatabase() {
  await mongoose.connection.close();
}

module.exports = { connectDatabase, disconnectDatabase };
