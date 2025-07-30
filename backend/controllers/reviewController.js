import reviewModel from '../models/reviewModel.js';
import appointmentModel from '../models/appointmentModel.js';
import doctorModel from '../models/doctorModel.js';
import mongoose from 'mongoose';

// Helper function to update doctor's average rating
const updateDoctorRating = async (doctorId) => {
  try {
    // Find all reviews for the doctor
    const reviews = await reviewModel.find({ doctorId });
    
    // Calculate average rating
    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = parseFloat((totalRating / reviews.length).toFixed(1));
    }
    
    // Update doctor's average rating and reviews count
    await doctorModel.findByIdAndUpdate(doctorId, {
      averageRating,
      reviewsCount: reviews.length
    });
    
    return { averageRating, reviewsCount: reviews.length };
  } catch (error) {
    console.error('Error updating doctor rating:', error);
    throw error;
  }
};

// Create a new review
export const createReview = async (req, res) => {
  try {
    const { doctorId, appointmentId, rating, comment } = req.body;
    const userId = req.user.id; // From auth middleware

    // Validate required fields
    if (!doctorId || !appointmentId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if appointment exists and belongs to the user
    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify the appointment belongs to the user
    if (appointment.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only review your own appointments'
      });
    }

    // Verify the appointment is for the specified doctor
    if (appointment.doctorId.toString() !== doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID does not match the appointment'
      });
    }

    // Check if appointment is completed
    if (appointment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You can only review completed appointments'
      });
    }

    // Check if user has already reviewed this doctor
    const existingReview = await reviewModel.findOne({
      userId,
      doctorId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this doctor'
      });
    }

    // Create new review
    const review = new reviewModel({
      userId,
      doctorId,
      appointmentId,
      rating,
      comment
    });

    await review.save();
    
    // Update doctor's average rating
    const { averageRating, reviewsCount } = await updateDoctorRating(doctorId);

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review,
      averageRating,
      reviewsCount
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all reviews for a doctor
export const getDoctorReviews = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Validate doctorId
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID'
      });
    }

    // Find all reviews for the doctor
    const reviews = await reviewModel.find({ doctorId })
      .populate('userId', 'name image')
      .sort({ createdAt: -1 });

    // Get doctor's average rating from the database
    const doctor = await doctorModel.findById(doctorId, 'averageRating reviewsCount');

    return res.status(200).json({
      success: true,
      reviews,
      averageRating: doctor ? doctor.averageRating : 0,
      count: doctor ? doctor.reviewsCount : 0
    });
  } catch (error) {
    console.error('Error fetching doctor reviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update a review
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id; // From auth middleware

    // Validate required fields
    if (!rating && !comment) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    // Validate rating range if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Find the review
    const review = await reviewModel.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Verify the review belongs to the user
    if (review.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own reviews'
      });
    }

    // Update the review
    if (rating) review.rating = rating;
    if (comment) review.comment = comment;

    await review.save();
    
    // Update doctor's average rating
    const { averageRating, reviewsCount } = await updateDoctorRating(review.doctorId);

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review,
      averageRating,
      reviewsCount
    });
  } catch (error) {
    console.error('Error updating review:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete a review
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id; // From auth middleware

    // Find the review
    const review = await reviewModel.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Verify the review belongs to the user
    if (review.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
    }
    
    // Store doctorId before deleting the review
    const doctorId = review.doctorId;

    // Delete the review
    await reviewModel.findByIdAndDelete(reviewId);
    
    // Update doctor's average rating
    const { averageRating, reviewsCount } = await updateDoctorRating(doctorId);

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
      averageRating,
      reviewsCount
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get a user's review for a specific doctor
export const getUserReviewForDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const userId = req.user.id; // From auth middleware

    // Find the review
    const review = await reviewModel.findOne({
      userId,
      doctorId
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
        hasReview: false
      });
    }

    return res.status(200).json({
      success: true,
      review,
      hasReview: true
    });
  } catch (error) {
    console.error('Error fetching user review:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all reviews by a user
export const getUserReviews = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware

    // Find all reviews by the user
    const reviews = await reviewModel.find({ userId })
      .populate('doctorId', 'name speciality image')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      reviews,
      count: reviews.length
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}; 