import express from 'express';
import { createPayment, getAllPayments, getUserPayments, updatePaymentStatus, getPaymentStats, downloadInvoice, downloadCombinedReceipt } from '../controllers/paymentController.js';
import { authenticateToken, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Create a new payment record
router.post('/', authenticateToken, createPayment);

// Get all payments (admin only)
router.get('/', authenticateToken, isAdmin, getAllPayments);

// Get payment statistics (admin only)
router.get('/stats', authenticateToken, isAdmin, getPaymentStats);

// Get payments by user ID
router.get('/user/:userId', authenticateToken, getUserPayments);

// Update payment status (admin only)
router.patch('/:paymentId', authenticateToken, isAdmin, updatePaymentStatus);

// Download payment invoice PDF
router.get('/invoice/:paymentId', authenticateToken, downloadInvoice);

// Download combined receipt (appointment slip + payment invoice)
router.get('/receipt/:paymentId', authenticateToken, downloadCombinedReceipt);

export default router;