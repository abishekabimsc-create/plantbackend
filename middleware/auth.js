const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const Admin = require('../models/Admin');
const { jwtSecret } = require('../config/env');

/**
 * Rejects the request unless it carries a valid, unexpired admin JWT whose
 * subject still exists in the database.
 */
const requireAdmin = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Sign in to continue.');
  }

  const token = header.slice(7).trim();
  let payload;

  try {
    payload = jwt.verify(token, jwtSecret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Your session expired. Sign in again.');
    }
    throw ApiError.unauthorized('Invalid session. Sign in again.');
  }

  const admin = await Admin.findById(payload.sub);
  if (!admin) {
    throw ApiError.unauthorized('This account no longer exists.');
  }

  req.admin = admin;
  next();
});

module.exports = { requireAdmin };
