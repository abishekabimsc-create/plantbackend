const fs = require('fs/promises');
const path = require('path');
const { uploadsDir } = require('../config/env');

/**
 * Removes an uploaded file referenced by a stored path such as
 * "/uploads/banner-172.webp". Paths outside the uploads directory are ignored
 * so a tampered database value cannot delete arbitrary files.
 */
async function removeUpload(storedPath) {
  if (!storedPath || typeof storedPath !== 'string') return false;
  if (!storedPath.startsWith('/uploads/')) return false;

  const filename = path.basename(storedPath);
  const target = path.join(uploadsDir, filename);
  const resolved = path.resolve(target);

  if (!resolved.startsWith(path.resolve(uploadsDir) + path.sep)) return false;

  try {
    await fs.unlink(resolved);
    return true;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`[files] could not remove ${filename}: ${error.message}`);
    }
    return false;
  }
}

/** Public path stored in MongoDB for a Multer file. */
const toPublicPath = (file) => `/uploads/${file.filename}`;

module.exports = { removeUpload, toPublicPath };
