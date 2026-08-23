const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const ApiError = require('../utils/ApiError');
const { uploadsDir, maxUploadBytes } = require('../config/env');

const ALLOWED_MIME = new Map([
  ['image/jpeg', '.jpg'],
  ['image/pjpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);

fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadsDir);
  },
  // Never trust the client filename: derive a random name and take the
  // extension from the validated MIME type.
  filename(_req, file, cb) {
    const extension = ALLOWED_MIME.get(file.mimetype) || '.jpg';
    const unique = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    cb(null, `${unique}${extension}`);
  },
});

function fileFilter(_req, file, cb) {
  const extension = path.extname(file.originalname).toLowerCase();
  const extensionAllowed = ['.jpg', '.jpeg', '.png', '.webp'].includes(extension);

  if (!ALLOWED_MIME.has(file.mimetype) || !extensionAllowed) {
    return cb(
      ApiError.badRequest('Unsupported file type. Upload a JPG, PNG or WEBP image.')
    );
  }
  return cb(null, true);
}

/**
 * Leading bytes that genuinely identify each accepted format. Browsers derive
 * the Content-Type of an upload from the file extension, so a text file
 * renamed "photo.png" arrives claiming to be an image. Checking the signature
 * is the only way to know what was actually written to disk.
 */
const SIGNATURES = [
  { name: 'jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    name: 'png',
    test: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  {
    name: 'webp',
    test: (b) =>
      b.subarray(0, 4).toString('latin1') === 'RIFF' &&
      b.subarray(8, 12).toString('latin1') === 'WEBP',
  },
];

async function hasImageSignature(filePath) {
  let handle;
  try {
    handle = await fsp.open(filePath, 'r');
    const buffer = Buffer.alloc(12);
    const { bytesRead } = await handle.read(buffer, 0, 12, 0);
    if (bytesRead < 12) return false;
    return SIGNATURES.some((signature) => signature.test(buffer));
  } catch {
    return false;
  } finally {
    await handle?.close();
  }
}

const uploader = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxUploadBytes, files: 1 },
});

/**
 * Accepts a single optional image under the `image` field and converts
 * Multer's own errors into ApiError instances the error handler understands.
 */
const uploadImage = (fieldName = 'image') => (req, res, next) => {
  uploader.single(fieldName)(req, res, async (error) => {
    if (!error) {
      // Multer has already written the file; confirm it really is an image
      // before any controller records a path to it.
      if (req.file && !(await hasImageSignature(req.file.path))) {
        await fsp.unlink(req.file.path).catch(() => {});
        req.file = undefined;
        return next(
          ApiError.badRequest(
            'That file is not a real image. Upload a JPG, PNG or WEBP photo.'
          )
        );
      }
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        const limitMb = Math.round(maxUploadBytes / (1024 * 1024));
        return next(ApiError.badRequest(`Image is too large. Keep it under ${limitMb}MB.`));
      }
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(ApiError.badRequest(`Send the image in the "${fieldName}" field.`));
      }
      return next(ApiError.badRequest(error.message));
    }
    return next(error);
  });
};

module.exports = { uploadImage, maxUploadBytes };
