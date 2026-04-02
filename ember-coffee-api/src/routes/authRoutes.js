import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import {
  register,
  login,
  getProfile,
  updateProfile,
  uploadProfileImage,
} from '../controllers/authController.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/profile/upload', protect, upload.single('image'), uploadProfileImage);

export default router;
