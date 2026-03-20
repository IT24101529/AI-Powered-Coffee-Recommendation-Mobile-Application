// routes/reviewRoutes.js
// Reviews & Ratings endpoints.
// Owner: Ekanayake E.M.T.D.B. | IT24100917

const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');   // Ranasinghe's JWT middleware

const {
  createReview,
  getReviewsByProduct,
  getMyReviews,
  deleteReview,
  getReviewStats,
} = require('../controllers/reviewController');

// Public routes — anyone can read reviews
router.get('/product/:productId', getReviewsByProduct);

// Protected routes — must be logged in
router.post('/',          protect, createReview);
router.get('/my',         protect, getMyReviews);
router.get('/stats',      protect, getReviewStats);   // admin analytics
router.delete('/:id',     protect, deleteReview);

module.exports = router;
