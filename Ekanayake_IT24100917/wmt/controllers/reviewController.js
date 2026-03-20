// controllers/reviewController.js
// Reviews & Ratings CRUD logic.
// Owner: Ekanayake E.M.T.D.B. | IT24100917

const Review  = require('../models/Review');
const Product = require('../models/Product');   // Bandara's model

// ── POST /api/reviews  — Submit a review ──────────────────────
exports.createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    // Validation
    if (!productId || rating === undefined || !comment) {
      return res.status(400).json({ message: 'productId, rating, and comment are all required.' });
    }

    const parsedRating = Number(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
    }

    // Check product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Check for duplicate review
    const existing = await Review.findOne({ userId: req.user.id, productId });
    if (existing) {
      return res.status(409).json({
        message: 'You have already reviewed this product. Delete your existing review to submit a new one.',
      });
    }

    const review = await Review.create({
      userId:    req.user.id,
      productId,
      rating:    parsedRating,
      comment,
    });

    res.status(201).json({ message: 'Review submitted successfully.', review });
  } catch (err) {
    console.error('[createReview]', err.message);
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ── GET /api/reviews/product/:productId  — All reviews for a product ──
exports.getReviewsByProduct = async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    const avgRating =
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    // Rating distribution (1–5 stars)
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => { distribution[r.rating] = (distribution[r.rating] || 0) + 1; });

    res.status(200).json({
      productId:    req.params.productId,
      total:        reviews.length,
      avgRating:    parseFloat(avgRating),
      distribution,
      reviews,
    });
  } catch (err) {
    console.error('[getReviewsByProduct]', err.message);
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ── GET /api/reviews/my  — Reviews submitted by the logged-in user ──
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user.id })
      .populate('productId', 'name price image category')
      .sort({ createdAt: -1 });

    res.status(200).json({
      total:   reviews.length,
      reviews,
    });
  } catch (err) {
    console.error('[getMyReviews]', err.message);
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ── DELETE /api/reviews/:id  — Delete your own review ──────────
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    // Only the owner (or an admin) can delete a review
    if (review.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden — you can only delete your own reviews.' });
    }

    await Review.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Review deleted successfully.' });
  } catch (err) {
    console.error('[deleteReview]', err.message);
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ── GET /api/reviews/stats  — Admin: aggregate stats across all reviews ──
exports.getReviewStats = async (req, res) => {
  try {
    const total = await Review.countDocuments();

    const avgRatingResult = await Review.aggregate([
      { $group: { _id: null, avg: { $avg: '$rating' } } },
    ]);
    const avgRating = avgRatingResult.length ? avgRatingResult[0].avg.toFixed(2) : 0;

    // Top 5 highest-rated products
    const topRated = await Review.aggregate([
      { $group: { _id: '$productId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      { $sort: { avgRating: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: { productName: '$product.name', avgRating: { $round: ['$avgRating', 2] }, count: 1 } },
    ]);

    res.status(200).json({ total, avgRating: parseFloat(avgRating), topRated });
  } catch (err) {
    console.error('[getReviewStats]', err.message);
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};
