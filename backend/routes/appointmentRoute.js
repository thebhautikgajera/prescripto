import express from 'express';
import { 
  createAppointment, 
  getUserAppointments, 
  getDoctorAppointments, 
  updateAppointmentStatus, 
  updatePaymentStatus, 
  deleteAppointment,
  getAllAppointments,
  createPaymentOrder,
  verifyPayment,
  downloadAppointmentSlip
} from '../controllers/appointmentController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Create a new appointment
router.post('/create', authenticateToken, createAppointment);

// Get all appointments (admin only)
router.get('/all', authenticateToken, getAllAppointments);

// Get all appointments for a user
router.get('/user/:userId', authenticateToken, getUserAppointments);

// Get all appointments for a doctor
router.get('/doctor/:doctorId', authenticateToken, getDoctorAppointments);

// Update appointment status
router.patch('/status/:appointmentId', authenticateToken, updateAppointmentStatus);

// Update payment status
router.patch('/payment/:appointmentId', authenticateToken, updatePaymentStatus);

// Delete an appointment
router.delete('/:appointmentId', authenticateToken, deleteAppointment);

// Download appointment slip PDF
router.get('/slip/:appointmentId', authenticateToken, downloadAppointmentSlip);

// Razorpay payment routes
router.post('/create-payment/:appointmentId', authenticateToken, createPaymentOrder);
router.post('/verify-payment', authenticateToken, verifyPayment);

export default router; 