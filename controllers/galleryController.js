const Gallery = require('../models/Gallery');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { removeUpload, toPublicPath } = require('../utils/files');

const REGEX_SPECIALS = /[-[\]{}()*+?.,\^$|#\s]/g;
const escapeRegex = (value) => String(value).replace(REGEX_SPECIALS, '\$&');

// GET /api/gallery  (public) - supports ?featured=true, ?category=, ?limit=, ?search=
const listGallery = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.featured === 'true') filter.featured = true;
  if (req.query.category && req.query.category !== 'All') filter.category = req.query.category;
  if (req.query.search) filter.name = new RegExp(escapeRegex(req.query.search), 'i');

  const limit = Math.min(Number(req.query.limit) || 0, 100);
  let query = Gallery.find(filter).sort({ createdAt: -1 });
  if (limit) query = query.limit(limit);

  const [items, total] = await Promise.all([query, Gallery.countDocuments(filter)]);

  res.status(200).json({ success: true, count: items.length, total, data: items });
});

// GET /api/gallery/:id  (public)
const getGalleryItem = asyncHandler(async (req, res) => {
  const item = await Gallery.findById(req.params.id);
  if (!item) throw ApiError.notFound('That product is no longer listed.');
  res.status(200).json({ success: true, data: item });
});

// POST /api/gallery  (admin)
const createGalleryItem = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('Choose a product image to upload.', [
      { field: 'image', message: 'A product image is required.' },
    ]);
  }

  const item = await Gallery.create({
    imageUrl: toPublicPath(req.file),
    name: req.body.name,
    price: req.body.price,
    offerPercent: req.body.offerPercent || 0,
    description: req.body.description,
    category: req.body.category || undefined,
    featured: Boolean(req.body.featured),
  });

  res.status(201).json({
    success: true,
    message: `"${item.name}" added to the gallery.`,
    data: item,
  });
});

// PUT /api/gallery/:id  (admin)
const updateGalleryItem = asyncHandler(async (req, res) => {
  const item = await Gallery.findById(req.params.id);
  if (!item) throw ApiError.notFound('That product is no longer listed.');

  const previousImage = item.imageUrl;

  if (req.file) item.imageUrl = toPublicPath(req.file);
  ['name', 'price', 'description', 'category'].forEach((field) => {
    if (req.body[field] !== undefined && req.body[field] !== '') item[field] = req.body[field];
  });
  // Handled separately: 0 is a meaningful value here (it clears the offer),
  // so it must not be filtered out the way an empty string is.
  if (req.body.offerPercent !== undefined) item.offerPercent = Number(req.body.offerPercent) || 0;
  if (req.body.featured !== undefined) item.featured = Boolean(req.body.featured);

  await item.save();

  if (req.file && previousImage !== item.imageUrl) {
    await removeUpload(previousImage);
  }

  res.status(200).json({ success: true, message: `"${item.name}" updated.`, data: item });
});

// DELETE /api/gallery/:id  (admin)
const deleteGalleryItem = asyncHandler(async (req, res) => {
  const item = await Gallery.findByIdAndDelete(req.params.id);
  if (!item) throw ApiError.notFound('That product is no longer listed.');

  await removeUpload(item.imageUrl);

  res.status(200).json({
    success: true,
    message: `"${item.name}" deleted.`,
    data: { id: item._id },
  });
});

module.exports = {
  listGallery,
  getGalleryItem,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
};
