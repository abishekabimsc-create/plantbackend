const express = require('express');
const {
  listBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} = require('../controllers/bannerController');
const { requireAdmin } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');
const { validateBanner } = require('../middleware/validate');

const router = express.Router();

router.get('/', listBanners);

router.post('/', requireAdmin, uploadImage('image'), validateBanner(), createBanner);
router.put('/:id', requireAdmin, uploadImage('image'), validateBanner({ partial: true }), updateBanner);
router.delete('/:id', requireAdmin, deleteBanner);

module.exports = router;
