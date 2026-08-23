const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: [true, 'Product image is required'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
      maxlength: [90, 'Product name must be 90 characters or fewer'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      max: [10000000, 'Price is out of range'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description must be 2000 characters or fewer'],
    },
    /**
     * Discount off `price`, as a whole percentage. 0 means no offer.
     * `price` always stays the original — the discounted figure is derived,
     * so an offer can be added or removed without losing the real price.
     */
    offerPercent: {
      type: Number,
      default: 0,
      min: [0, 'Offer percentage cannot be negative'],
      max: [95, 'Offer percentage cannot be more than 95'],
    },
    category: {
      type: String,
      trim: true,
      // Keep in step with CATEGORIES in frontend/src/utils/constants.js
      enum: [
        'Indoor Plants',
        'Outdoor Plants',
        'Flowering Plants',
        'Fruit & Coconut Saplings',
        'Garden Supplies',
        'Planters',
        'Seeds',
      ],
      default: 'Indoor Plants',
      index: true,
    },
    featured: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.__v;
        // Mongoose adds an `id` alias alongside `_id` once virtuals are on.
        delete ret.id;
        return ret;
      },
    },
  }
);

/** Whether a discount is currently applied. */
gallerySchema.virtual('hasOffer').get(function hasOffer() {
  return Number(this.offerPercent) > 0;
});

/**
 * What the customer actually pays, rounded to whole rupees. Computed here so
 * the API is the single source of truth and no client can round differently.
 */
gallerySchema.virtual('offerPrice').get(function offerPrice() {
  const percent = Number(this.offerPercent);
  if (!percent || !Number.isFinite(this.price)) return this.price;
  return Math.round(this.price * (1 - percent / 100));
});

gallerySchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Gallery', gallerySchema);
