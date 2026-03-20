// models/Review.js
// Review & Rating model for the Coffee Recommendation App.
// Owner: Ekanayake E.M.T.D.B. | IT24100917

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    productId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Product',
      required: true,
    },
    rating: {
      type:     Number,
      required: true,
      min:      1,
      max:      5,
    },
    comment: {
      type:     String,
      required: true,
      trim:     true,
      maxlength: 1000,
    },
    // Filled later by Feature 2 (Bandara's sentiment analysis integration)
    sentiment: {
      type: String,
      enum: ['Positive', 'Neutral', 'Negative', null],
      default: null,
    },
  },
  { timestamps: true }
);

// Prevent one user reviewing the same product twice
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
