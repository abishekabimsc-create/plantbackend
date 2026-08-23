const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config/env');
const apiRoutes = require('./routes');
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

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header: curl, Postman, same-origin image requests.
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin.replace(/\/$/, ''))) return callback(null, true);
      if (!config.isProduction && /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS.`));
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
