const Banner = require('../models/Banner');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { removeUpload, toPublicPath } = require('../utils/files');
const { maxBanners } = require('../config/env');

/** The lowest slot (1-3) that is not taken yet, or null when the hero is full. */
async function nextFreePosition() {
  const taken = new Set((await Banner.find().select('position').lean()).map((b) => b.position));
  for (let position = 1; position <= maxBanners; position += 1) {
    if (!taken.has(position)) return position;
  }
  return null;
}

// GET /api/banners  (public)
const listBanners = asyncHandler(async (_req, res) => {
  const banners = await Banner.find().sort({ position: 1 });
  res.status(200).json({
    success: true,
    count: banners.length,
    maxBanners,
    remainingSlots: Math.max(0, maxBanners - banners.length),
    data: banners,
  });
});

// POST /api/banners  (admin)
const createBanner = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('Choose a banner image to upload.', [
      { field: 'image', message: 'A banner image is required.' },
    ]);
  }

  const total = await Banner.countDocuments();
  if (total >= maxBanners) {
    throw ApiError.conflict(
      `Maximum ${maxBanners} banners allowed. Replace or delete one first.`
    );
  }

  let position = req.body.position;

  if (position) {
    const occupied = await Banner.exists({ position });
    if (occupied) {
      throw ApiError.conflict(
        `Banner slot ${position} is already in use. Replace that banner instead.`
      );
    }
  } else {
    position = await nextFreePosition();
    if (!position) {
      throw ApiError.conflict(`Maximum ${maxBanners} banners allowed.`);
    }
  }

  const banner = await Banner.create({
    imageUrl: toPublicPath(req.file),
    position,
    title: req.body.title || '',
    subtitle: req.body.subtitle || '',
    alt: req.body.alt || req.body.title || 'Sri Veludaiyan Nursery Garden banner',
  });

  res.status(201).json({ success: true, message: `Banner ${position} added.`, data: banner });
});

// PUT /api/banners/:id  (admin) - replace the image and/or edit the captions
const updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) throw ApiError.notFound('That banner no longer exists.');

  const previousImage = banner.imageUrl;

  if (req.file) banner.imageUrl = toPublicPath(req.file);
  if (req.body.title !== undefined) banner.title = req.body.title;
  if (req.body.subtitle !== undefined) banner.subtitle = req.body.subtitle;
  if (req.body.alt !== undefined) banner.alt = req.body.alt;

  if (req.body.position !== undefined && req.body.position !== banner.position) {
    const occupied = await Banner.findOne({
      position: req.body.position,
      _id: { $ne: banner._id },
    });
    if (occupied) throw ApiError.conflict(`Banner slot ${req.body.position} is already in use.`);
    banner.position = req.body.position;
  }

  await banner.save();

  // Only drop the old file once the new record is safely persisted.
  if (req.file && previousImage !== banner.imageUrl) {
    await removeUpload(previousImage);
  }

  res.status(200).json({
    success: true,
    message: `Banner ${banner.position} updated.`,
    data: banner,
  });
});

// DELETE /api/banners/:id  (admin)
const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) throw ApiError.notFound('That banner no longer exists.');

  await removeUpload(banner.imageUrl);

  res.status(200).json({
    success: true,
    message: `Banner ${banner.position} deleted.`,
    data: { id: banner._id, position: banner.position },
  });
});

module.exports = { listBanners, createBanner, updateBanner, deleteBanner };
