import { Router } from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  validatePromoCode,
  uploadPromoBanner,
} from '../controllers/promoController.js';

const router = Router();

router.get('/', getPromotions);
router.post('/', protect, adminOnly, createPromotion);
router.put('/:id', protect, adminOnly, updatePromotion);
router.delete('/:id', protect, adminOnly, deletePromotion);
router.post('/validate/:promoCode', protect, validatePromoCode);
router.post('/:id/upload', protect, adminOnly, upload.single('image'), uploadPromoBanner);

export default router;
