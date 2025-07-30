import paymentModel from '../models/paymentModel.js';
import appointmentModel from '../models/appointmentModel.js';
import doctorModel from '../models/doctorModel.js';
import userModel from '../models/userModel.js';
import { generateInvoicePdf, generateCombinedReceiptPdf } from '../utils/pdfUtils.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a new payment record
export const createPayment = async (req, res) => {
  try {
    const { appointmentId, amount, paymentMethod, paymentId, orderId, status } = req.body;
    
    // Validate appointmentId
    if (!appointmentId || appointmentId === 'undefined' || appointmentId === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing appointment ID'
      });
    }
    
    // Find the appointment to get userId and doctorId
    const appointment = await appointmentModel.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Create payment record
    const payment = new paymentModel({
      appointmentId,
      userId: appointment.userId,
      doctorId: appointment.doctorId,
      amount,
      paymentMethod,
      paymentId: paymentId || '',
      orderId: orderId || '',
      status: status || 'pending'
    });
    
    await payment.save();
    
    // Update appointment payment status if payment is completed
    if (status === 'completed') {
      appointment.paymentStatus = 'completed';
      appointment.paymentMethod = paymentMethod;
      await appointment.save();
      
      // Generate invoice PDF if payment is completed
      try {
        // We need to populate the payment with user and doctor details for the PDF
        const populatedPayment = await paymentModel.findById(payment._id)
          .populate('userId', 'name email phone')
          .populate('doctorId', 'name email speciality address phone')
          .populate('appointmentId');
        
        if (populatedPayment) {
          const pdfPath = await generateInvoicePdf(populatedPayment);
          // We don't need to wait for this, just log it
          console.log(`Invoice PDF generated: ${pdfPath}`);
        }
      } catch (pdfError) {
        console.error('Error generating invoice PDF:', pdfError);
        // Continue with the success response even if PDF generation fails
      }
    }
    
    return res.status(201).json({
      success: true,
      message: 'Payment record created successfully',
      payment
    });
  } catch (error) {
    console.error('Error creating payment record:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all payments (for admin)
export const getAllPayments = async (req, res) => {
  try {
    const payments = await paymentModel.find()
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name email speciality')
      .populate('appointmentId', 'appointmentDate appointmentTime status')
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get payments by user ID
export const getUserPayments = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId to avoid Mongoose cast error
    if (!userId || userId === 'undefined' || userId === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing user ID'
      });
    }
    
    const payments = await paymentModel.find({ userId })
      .populate('doctorId', 'name email speciality')
      .populate('appointmentId', 'appointmentDate appointmentTime status')
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      payments
    });
  } catch (error) {
    console.error('Error fetching user payments:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status } = req.body;
    
    // Validate paymentId
    if (!paymentId || paymentId === 'undefined' || paymentId === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing payment ID'
      });
    }
    
    // Validate status
    const validStatuses = ['pending', 'completed', 'refunded', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status'
      });
    }
    
    const payment = await paymentModel.findByIdAndUpdate(
      paymentId,
      { status },
      { new: true }
    );
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    // If payment is completed or refunded, update appointment payment status
    if (status === 'completed' || status === 'refunded') {
      await appointmentModel.findByIdAndUpdate(
        payment.appointmentId,
        { paymentStatus: status === 'completed' ? 'completed' : 'refunded' }
      );
      
      // Generate invoice PDF if payment is completed
      if (status === 'completed') {
        try {
          // We need to populate the payment with user and doctor details for the PDF
          const populatedPayment = await paymentModel.findById(payment._id)
            .populate('userId', 'name email phone')
            .populate('doctorId', 'name email speciality address phone')
            .populate('appointmentId');
          
          if (populatedPayment) {
            const pdfPath = await generateInvoicePdf(populatedPayment);
            // We don't need to wait for this, just log it
            console.log(`Invoice PDF generated: ${pdfPath}`);
          }
        } catch (pdfError) {
          console.error('Error generating invoice PDF:', pdfError);
          // Continue with the success response even if PDF generation fails
        }
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      payment
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get payment statistics (for admin dashboard)
export const getPaymentStats = async (req, res) => {
  try {
    // Total revenue
    const totalRevenue = await paymentModel.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Monthly revenue for current year
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = await paymentModel.aggregate([
      { 
        $match: { 
          status: 'completed',
          createdAt: { 
            $gte: new Date(`${currentYear}-01-01`), 
            $lt: new Date(`${currentYear+1}-01-01`) 
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Payment methods distribution
    const paymentMethods = await paymentModel.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$amount' } } }
    ]);
    
    return res.status(200).json({
      success: true,
      stats: {
        totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
        monthlyRevenue,
        paymentMethods
      }
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}; 

// Download invoice PDF
export const downloadInvoice = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // Validate paymentId
    if (!paymentId || paymentId === 'undefined' || paymentId === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing payment ID'
      });
    }
    
    // Find the payment and populate related data
    const payment = await paymentModel.findById(paymentId)
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name email speciality address phone')
      .populate('appointmentId');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    // Check if PDF already exists
    const pdfDir = path.join(__dirname, '../pdfs');
    const pdfPath = path.join(pdfDir, `invoice_${paymentId}.pdf`);
    
    let finalPdfPath;
    
    try {
      // Check if file exists
      await fs.access(pdfPath);
      finalPdfPath = pdfPath;
    } catch (error) {
      // PDF doesn't exist, generate it
      finalPdfPath = await generateInvoicePdf(payment);
    }
    
    // Send the PDF file
    return res.download(finalPdfPath, `prescripto_invoice_${payment.paymentId}.pdf`);
  } catch (error) {
    console.error('Error downloading invoice:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}; 

// Download combined receipt (appointment slip + payment invoice)
export const downloadCombinedReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // Validate paymentId
    if (!paymentId || paymentId === 'undefined' || paymentId === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing payment ID'
      });
    }
    
    // Find the payment and populate related data
    const payment = await paymentModel.findById(paymentId)
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name email speciality address phone')
      .populate('appointmentId');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    // Get the appointment details
    const appointment = await appointmentModel.findById(payment.appointmentId)
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name email speciality address phone');
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if combined PDF already exists
    const pdfDir = path.join(__dirname, '../pdfs');
    const pdfPath = path.join(pdfDir, `receipt_${appointment._id}_${payment._id}.pdf`);
    
    let finalPdfPath;
    
    try {
      // Check if file exists
      await fs.access(pdfPath);
      finalPdfPath = pdfPath;
    } catch (error) {
      // PDF doesn't exist, generate it
      finalPdfPath = await generateCombinedReceiptPdf(appointment, payment);
    }
    
    // Send the PDF file
    return res.download(finalPdfPath, `receipt_${appointment.appointmentId}.pdf`);
  } catch (error) {
    console.error('Error downloading combined receipt:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};