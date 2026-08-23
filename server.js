const config = require('./config/env');
const app = require('./app');
const { connectDatabase, disconnectDatabase } = require('./config/db');
const { ensureAdminAccount } = require('./controllers/authController');

async function start() {
  try {
    await connectDatabase();
    console.log('[mongo] connected');

    await ensureAdminAccount();

    const server = app.listen(config.port, () => {
      console.log(`\n  Sri Veludaiyan Nursery API ready`);
      console.log(`  Local:    ${config.serverUrl}`);
      console.log(`  Health:   ${config.serverUrl}/api/health`);
      console.log(`  Uploads:  ${config.serverUrl}/uploads`);
      console.log(`  Origins:  ${config.clientOrigins.join(', ')}\n`);
    });

    const shutdown = async (signal) => {
      console.log(`\n[server] ${signal} received, shutting down`);
      server.close(async () => {
        await disconnectDatabase();
        process.exit(0);
      });
      // Do not hang forever if a connection refuses to close.
      setTimeout(() => process.exit(1), 10000).unref();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('unhandledRejection', (reason) => {
      console.error('[server] unhandled rejection:', reason);
    });
  } catch (error) {
    console.error('\n[server] failed to start:', error.message);
    if (error.name === 'MongooseServerSelectionError') {
      console.error('[server] Could not reach MongoDB at', config.mongoUri);
      console.error('[server] Start a local mongod, or point MONGODB_URI at MongoDB Atlas.\n');
    }
    process.exit(1);
  }
}

start();
