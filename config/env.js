const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const required = ['MONGODB_URI', 'JWT_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  // The right fix depends on where this is running. A local checkout reads a
  // .env file; a hosting platform injects variables into the process and will
  // never have one. Telling someone on Railway to "copy .env.example" sends
  // them looking for a file that must not exist there.
  const onPlatform = Boolean(
    process.env.RAILWAY_ENVIRONMENT ||
      process.env.RENDER ||
      process.env.FLY_APP_NAME ||
      process.env.DYNO ||
      process.env.VERCEL ||
      process.env.KUBERNETES_SERVICE_HOST
  );

  console.error(`\n[config] Missing required environment variables: ${missing.join(', ')}\n`);

  if (onPlatform) {
    console.error("[config] Add them to this service's environment variables, then redeploy.");
    console.error('[config] Railway: service -> Variables.   Render: service -> Environment.');
    console.error('[config] Do not commit a .env file — it is git-ignored on purpose.\n');
  } else {
    console.error('[config] Copy .env.example to .env in this folder and fill in the values.');
    console.error('[config] Then check the database with:  npm run check-db\n');
  }

  process.exit(1);
}

if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET === 'change_this_secret') {
  console.error('[config] Refusing to start in production with the example JWT_SECRET.');
  process.exit(1);
}

const toList = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim().replace(/\/$/, ''))
    .filter(Boolean);

module.exports = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
  adminUsername: process.env.ADMIN_USERNAME,
  adminPassword: process.env.ADMIN_PASSWORD,
  clientOrigins: toList(process.env.CLIENT_URL || 'http://localhost:5173'),
  serverUrl: (process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, ''),
  maxUploadBytes: (Number(process.env.MAX_UPLOAD_SIZE_MB) || 5) * 1024 * 1024,
  uploadsDir: path.join(__dirname, '..', 'uploads'),
  maxBanners: 3,
};
