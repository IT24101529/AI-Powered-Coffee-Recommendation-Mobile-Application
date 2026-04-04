import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import {
  getStoreReviews,
  createStoreReview,
  uploadStoreReviewImage,
} from '../controllers/storeReviewController.js';

const router = Router();

router.get('/',            getStoreReviews);
router.post('/',           protect, createStoreReview);
router.post('/:id/upload', protect, upload.single('image'), uploadStoreReviewImage);

export default router;
