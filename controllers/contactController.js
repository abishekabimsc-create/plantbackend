const Contact = require('../models/Contact');
const Gallery = require('../models/Gallery');
const Banner = require('../models/Banner');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { maxBanners } = require('../config/env');

// POST /api/contact  (public)
const submitContact = asyncHandler(async (req, res) => {
  const enquiry = await Contact.create({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    message: req.body.message,
  });

  const firstName = enquiry.name.split(' ')[0];

  res.status(201).json({
    success: true,
    message: `Thanks ${firstName} - your message reached our team. We reply within one working day.`,
    data: { id: enquiry._id, createdAt: enquiry.createdAt },
  });
});

// GET /api/contact  (admin)
const listContacts = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const enquiries = await Contact.find().sort({ createdAt: -1 }).limit(limit);
  res.status(200).json({ success: true, count: enquiries.length, data: enquiries });
});

// PATCH /api/contact/:id/handled  (admin)
const markHandled = asyncHandler(async (req, res) => {
  const enquiry = await Contact.findByIdAndUpdate(
    req.params.id,
    { handled: req.body.handled !== false },
    { new: true }
  );
  if (!enquiry) throw ApiError.notFound('That enquiry no longer exists.');
  res.status(200).json({ success: true, data: enquiry });
});

// GET /api/stats  (admin) - powers the dashboard overview cards
const getStats = asyncHandler(async (_req, res) => {
  const [galleryTotal, featuredTotal, bannerTotal, enquiryTotal, openEnquiries, latestItems] =
    await Promise.all([
      Gallery.countDocuments(),
      Gallery.countDocuments({ featured: true }),
      Banner.countDocuments(),
      Contact.countDocuments(),
      Contact.countDocuments({ handled: false }),
      Gallery.find().sort({ createdAt: -1 }).limit(5).select('name price offerPercent imageUrl createdAt'),
    ]);

  res.status(200).json({
    success: true,
    data: {
      galleryTotal,
      featuredTotal,
      bannerTotal,
      maxBanners,
      bannerSlotsFree: Math.max(0, maxBanners - bannerTotal),
      enquiryTotal,
      openEnquiries,
      latestItems,
    },
  });
});

module.exports = { submitContact, listContacts, markHandled, getStats };
