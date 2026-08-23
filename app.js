const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config/env');
const apiRoutes = require('./routes');
const ApiError = require('./utils/ApiError');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

// Images are served to a different origin than the API, so the default
// same-origin resource policy would block them in the browser.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);

const allowedOrigins = new Set(config.clientOrigins);

// A browser reports a blocked request as an opaque CORS failure with no clue
// which origin was refused, so log each one once. The message names the exact
// value to add to CLIENT_URL — the single most common deployment mistake here.
const reportedOrigins = new Set();

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header: curl, Postman, same-origin image requests.
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin.replace(/\/$/, ''))) return callback(null, true);
      if (!config.isProduction && /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }

      if (!reportedOrigins.has(origin)) {
        reportedOrigins.add(origin);
        console.warn(
          `\n[cors] Refused a request from ${origin}\n` +
            `[cors] Allowed right now: ${config.clientOrigins.join(', ')}\n` +
            `[cors] To permit it, set CLIENT_URL=${origin} and restart.\n` +
            '[cors] Several origins can be given, comma-separated.\n'
        );
      }

      // 403, not the 500 a bare Error would produce: a refused origin is a
      // rejected request, not a fault in the server.
      return callback(ApiError.forbidden(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

if (!config.isProduction) {
  app.use(morgan('dev'));
}

// Uploaded images, cached hard because filenames are content-unique.
app.use(
  '/uploads',
  express.static(config.uploadsDir, {
    maxAge: config.isProduction ? '30d' : 0,
    fallthrough: true,
    index: false,
  })
);

app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    service: 'Sri Veludaiyan Nursery API',
    docs: '/api/health',
  });
});

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
