import { Router } from 'express';
import { protect, adminOnly, managerOrAdmin } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  uploadPaymentScreenshot,
} from '../controllers/orderController.js';

const router = Router();

router.post('/',           protect,              createOrder);
router.get('/my',          protect,              getMyOrders);
router.get('/',            protect, managerOrAdmin, getAllOrders);
router.put('/:id/status',  protect, managerOrAdmin, updateOrderStatus);
router.post('/:id/upload', protect, upload.single('image'), uploadPaymentScreenshot);

export default router;
