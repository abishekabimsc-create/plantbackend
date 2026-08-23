const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { jwtSecret, jwtExpiresIn, adminUsername, adminPassword } = require('../config/env');

const signToken = (admin) =>
  jwt.sign({ sub: admin._id.toString(), username: admin.username }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  });

/** Seconds until the freshly signed token expires — used by the client clock. */
const expiresInSeconds = (token) => {
  const { exp } = jwt.decode(token) || {};
  return exp ? exp - Math.floor(Date.now() / 1000) : null;
};

/**
 * Creates the admin account from environment variables on first boot, and
 * keeps the stored hash in sync if ADMIN_PASSWORD later changes. Called once
 * at startup and by scripts/createAdmin.js.
 */
async function ensureAdminAccount({ silent = false } = {}) {
  const username = adminUsername.trim().toLowerCase();
  const existing = await Admin.findOne({ username }).select('+passwordHash');

  if (!existing) {
    const passwordHash = await Admin.hashPassword(adminPassword);
    const created = await Admin.create({ username, passwordHash });
    if (!silent) console.log(`[auth] created admin account "${username}"`);
    return { admin: created, created: true, updated: false };
  }

  const matches = await existing.verifyPassword(adminPassword);
  if (!matches) {
    existing.passwordHash = await Admin.hashPassword(adminPassword);
    await existing.save();
    if (!silent) console.log(`[auth] refreshed password for admin "${username}"`);
    return { admin: existing, created: false, updated: true };
  }

  return { admin: existing, created: false, updated: false };
}

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username }).select('+passwordHash');

  // Same response for an unknown user and a wrong password so the endpoint
  // does not reveal which usernames exist.
  const passwordMatches = admin ? await admin.verifyPassword(password) : false;
  if (!admin || !passwordMatches) {
    throw ApiError.unauthorized('Incorrect username or password.');
  }

  admin.lastLoginAt = new Date();
  await admin.save();

  const token = signToken(admin);

  res.status(200).json({
    success: true,
    message: 'Signed in.',
    data: {
      token,
      expiresIn: expiresInSeconds(token),
      admin: {
        id: admin._id,
        username: admin.username,
        displayName: admin.displayName,
        lastLoginAt: admin.lastLoginAt,
      },
    },
  });
});

// GET /api/auth/me — lets the client confirm a stored token is still valid
const me = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      admin: {
        id: req.admin._id,
        username: req.admin.username,
        displayName: req.admin.displayName,
        lastLoginAt: req.admin.lastLoginAt,
      },
    },
  });
});

module.exports = { login, me, ensureAdminAccount };
