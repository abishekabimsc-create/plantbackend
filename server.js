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
      // Report the port actually bound, not the one we asked for, and say
      // where it came from. On a hosting platform an unset PORT means the
      // router cannot reach the app even though the process looks healthy.
      const bound = server.address();
      const portSource = process.env.PORT ? 'from PORT' : 'default — PORT not set';

      console.log(`\n  Sri Veludaiyan Nursery API ready`);
      console.log(`  Listening: ${bound.address}:${bound.port}  (${portSource})`);
      console.log(`  Health:    ${config.serverUrl}/api/health`);
      console.log(`  Origins:   ${config.clientOrigins.join(', ')}\n`);

      if (config.isProduction && !process.env.PORT) {
        console.warn(
          '[warn] PORT is not set. Most hosts assign one and route only to it,\n' +
            `[warn] so traffic may never reach this process on ${bound.port}.\n`
        );
      }

      if (config.isProduction && !process.env.CLIENT_URL) {
        console.warn(
          '[warn] CLIENT_URL is not set, so the CORS allow-list is still\n' +
            '[warn] http://localhost:5173. Requests from your deployed front end\n' +
            '[warn] will be rejected. Set it to that site\'s origin and redeploy.\n'
        );
      }
    });

    // Without this, a port clash or a privileged port exits on an unhandled
    // 'error' event and buries the cause under a stack trace.
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`\n[server] Port ${config.port} is already in use.`);
        console.error('[server] Stop whatever is holding it, or set PORT to a free one.\n');
      } else if (error.code === 'EACCES') {
        console.error(`\n[server] Not allowed to bind port ${config.port}.`);
        console.error('[server] Ports below 1024 need elevated privileges.\n');
      } else {
        console.error('\n[server] Could not start listening:', error.message, '\n');
      }
      process.exit(1);
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
