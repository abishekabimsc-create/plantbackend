const ApiError = require('../utils/ApiError');
const { removeUpload, toPublicPath } = require('../utils/files');
const { isProduction } = require('../config/env');

function notFound(req, _res, next) {
  next(ApiError.notFound(`No route matches ${req.method} ${req.originalUrl}`));
}

/**
 * Centralised error handler. Translates Mongoose/JWT/Multer failures into
 * clean JSON, and discards any file Multer already wrote for a request that
 * ultimately failed so `uploads/` never collects orphans.
 */
// eslint-disable-next-line no-unused-vars
async function errorHandler(error, req, res, _next) {
  if (req.file) {
    await removeUpload(toPublicPath(req.file));
  }

  let statusCode = error.statusCode || 500;
  let message = error.message || 'Something went wrong on our side.';
  let details = error.details;

  if (error.name === 'ValidationError' && error.errors) {
    statusCode = 400;
    message = 'Please correct the highlighted fields.';
    details = Object.entries(error.errors).map(([field, fieldError]) => ({
      field,
      message: fieldError.message,
    }));
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = `"${error.value}" is not a valid ${error.path}.`;
  } else if (error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyValue || {})[0] || 'value';
    message =
      field === 'position'
        ? 'That banner slot is already in use.'
        : `That ${field} is already taken.`;
  } else if (error.name === 'MongooseServerSelectionError') {
    statusCode = 503;
    message = 'The database is unreachable. Check that MongoDB is running.';
  }

  if (statusCode >= 500) {
    console.error('[error]', error);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(isProduction ? {} : { stack: error.stack }),
  });
}

module.exports = { notFound, errorHandler };
