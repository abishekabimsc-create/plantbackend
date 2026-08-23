const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const required = ['MONGODB_URI', 'JWT_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(
    `\n[config] Missing required environment variables: ${missing.join(', ')}\n` +
      '[config] Copy backend/.env.example to backend/.env and fill in the values.\n'
  );
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
