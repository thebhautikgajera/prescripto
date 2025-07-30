import express from 'express';
import { 
  createReview, 
  getDoctorReviews, 
  updateReview, 
  deleteReview, 
  getUserReviewForDoctor,
  getUserReviews
} from '../controllers/reviewController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Create a new review - requires authentication
router.post('/create', authenticateToken, createReview);

// Get all reviews for a doctor - public
router.get('/doctor/:doctorId', getDoctorReviews);

// Get user's review for a specific doctor - requires authentication
router.get('/user/doctor/:doctorId', authenticateToken, getUserReviewForDoctor);

// Get all reviews by a user - requires authentication
router.get('/user', authenticateToken, getUserReviews);

// Update a review - requires authentication
router.put('/:reviewId', authenticateToken, updateReview);

// Delete a review - requires authentication
router.delete('/:reviewId', authenticateToken, deleteReview);

export default router; 