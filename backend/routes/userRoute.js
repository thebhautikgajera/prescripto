import express from 'express';
import { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile, 
  verifyUserOTP, 
  resendOTP, 
  forgotPassword, 
  resetPassword,
  changeVerificationEmail
} from '../controllers/userController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/multer.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyUserOTP);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-verification-email', changeVerificationEmail);

// Protected routes
router.get('/profile', authenticateToken, getUserProfile);
router.put('/profile', authenticateToken, upload.single('image'), updateUserProfile);

export default router; 