const express = require('express');
const {
  listGallery,
  getGalleryItem,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
} = require('../controllers/galleryController');
const { requireAdmin } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');
const { validateGalleryItem } = require('../middleware/validate');

const router = express.Router();

router.get('/', listGallery);
router.get('/:id', getGalleryItem);

router.post('/', requireAdmin, uploadImage('image'), validateGalleryItem(), createGalleryItem);
router.put(
  '/:id',
  requireAdmin,
  uploadImage('image'),
  validateGalleryItem({ partial: true }),
  updateGalleryItem
);
router.delete('/:id', requireAdmin, deleteGalleryItem);

module.exports = router;
