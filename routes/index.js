const express = require('express');
const authRoutes = require('./authRoutes');
const bannerRoutes = require('./bannerRoutes');
const galleryRoutes = require('./galleryRoutes');
const contactRoutes = require('./contactRoutes');
const { getStats } = require('../controllers/contactController');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    service: 'sri-veludaiyan-api',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/banners', bannerRoutes);
router.use('/gallery', galleryRoutes);
router.use('/contact', contactRoutes);
router.get('/stats', requireAdmin, getStats);

module.exports = router;
