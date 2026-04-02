import { Router } from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  uploadPaymentScreenshot,
} from '../controllers/orderController.js';

const router = Router();

router.post('/',              protect,              createOrder);
router.get('/my',             protect,              getMyOrders);          // must be before /:id routes
router.get('/',               protect, adminOnly,   getAllOrders);
router.put('/:id/status',     protect, adminOnly,   updateOrderStatus);
router.post('/:id/upload',    protect, upload.single('image'), uploadPaymentScreenshot);

export default router;
