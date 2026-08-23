const mongoose = require('mongoose');
const { maxBanners } = require('../config/env');

/**
 * A home page hero slide. The carousel holds exactly three slots, so
 * `position` is constrained to 1–3 and enforced unique at the index level —
 * the database itself refuses a fourth banner.
 */
const bannerSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: [true, 'Banner image is required'],
      trim: true,
    },
    position: {
      type: Number,
      required: true,
      min: [1, 'Position must be between 1 and 3'],
      max: [maxBanners, `Position must be between 1 and ${maxBanners}`],
      unique: true,
      index: true,
    },
    title: { type: String, trim: true, maxlength: 90, default: '' },
    subtitle: { type: String, trim: true, maxlength: 200, default: '' },
    alt: { type: String, trim: true, maxlength: 140, default: '' },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('Banner', bannerSchema);
