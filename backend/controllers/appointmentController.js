import appointmentModel from '../models/appointmentModel.js';
import doctorModel from '../models/doctorModel.js';
import userModel from '../models/userModel.js';
import paymentModel from '../models/paymentModel.js';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { sendAppointmentConfirmation } from '../utils/emailUtils.js';
import { generateAppointmentSlipPdf } from '../utils/pdfUtils.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Razorpay with fallback for missing credentials
let razorpay;
try {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn('Razorpay credentials missing. Payment features will be disabled.');
    razorpay = null;
  } else {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
} catch (error) {
  console.error('Error initializing Razorpay:', error);
  razorpay = null;
}

// Function to generate a unique appointment ID
const generateAppointmentId = async () => {
  // Generate a random 5-digit number
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  const appointmentId = `APT${randomNum}`;
  
  // Check if this ID already exists
  const existingAppointment = await appointmentModel.findOne({ appointmentId });
  
  // If it exists, recursively try again
  if (existingAppointment) {
    return generateAppointmentId();
  }
  
  return appointmentId;
};

// Create a new appointment
export const createAppointment = async (req, res) => {
  try {
    const { doctorId, userId, appointmentDate, appointmentTime, fees, notes, paymentStatus, paymentMethod } = req.body;

    // Validate required fields
    if (!doctorId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing doctor or user ID'
      });
    }

    if (!appointmentDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing appointment date'
      });
    }

    if (!appointmentTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing appointment time'
      });
    }

    if (!fees || isNaN(fees)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing fees'
      });
    }
    
    // Validate IDs to avoid Mongoose cast errors
    if (doctorId === 'undefined' || doctorId === 'null' || userId === 'undefined' || userId === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor or user ID'
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID format'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Check if doctor exists
    const doctor = await doctorModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check if user exists
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate date format
    let appointmentDateObj;
    try {
      appointmentDateObj = new Date(appointmentDate);
      if (isNaN(appointmentDateObj.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment date format'
      });
    }
    
    // Set payment status and method if provided
    const paymentStatusValue = paymentStatus || 'pending';
    const paymentMethodValue = paymentMethod || 'online';
    
    // Generate a unique appointment ID
    const appointmentId = await generateAppointmentId();
    
    // Create appointment
    const appointment = new appointmentModel({
      appointmentId,
      doctorId,
      userId,
      appointmentDate: appointmentDateObj,
      appointmentTime,
      fees,
      notes: notes || '',
      paymentStatus: paymentStatusValue,
      paymentMethod: paymentMethodValue
    });

    // Save the appointment
    await appointment.save();

    // Create payment record if payment is completed
    if (paymentStatusValue === 'completed') {
      const payment = new paymentModel({
        appointmentId: appointment._id,
        userId: userId,
        doctorId: doctorId,
        amount: fees,
        paymentMethod: paymentMethodValue,
        status: 'completed'
      });
      await payment.save();
      
      // Send appointment confirmation email
      try {
        const appointmentDetails = {
          patientName: user.name,
          doctorName: doctor.name,
          doctorSpeciality: doctor.speciality,
          date: appointmentDateObj,
          time: appointmentTime,
          appointmentType: 'Consultation',
          appointmentId: appointment.appointmentId // Use the new appointment ID format
        };
        
        await sendAppointmentConfirmation(user.email, appointmentDetails);
      } catch (emailError) {
        console.error('Failed to send appointment confirmation email:', emailError);
        // Continue with the success response even if email fails
      }
    }

    // Update doctor's slots_booked (optional enhancement)
    const dateKey = appointmentDateObj.toISOString().split('T')[0];
    if (!doctor.slots_booked) {
      doctor.slots_booked = {};
    }
    if (!doctor.slots_booked[dateKey]) {
      doctor.slots_booked[dateKey] = [];
    }
    doctor.slots_booked[dateKey].push(appointmentTime);
    await doctor.save();

    // Generate appointment slip PDF
    try {
      // Populate appointment with user and doctor details for the PDF
      const populatedAppointment = await appointmentModel.findById(appointment._id)
        .populate('userId', 'name email phone')
        .populate('doctorId', 'name email speciality address phone');
      
      if (populatedAppointment) {
        const pdfPath = await generateAppointmentSlipPdf(populatedAppointment);
        // We don't need to wait for this, just log it
        console.log(`Appointment slip PDF generated: ${pdfPath}`);
      }
    } catch (pdfError) {
      console.error('Error generating appointment slip PDF:', pdfError);
      // Continue with the success response even if PDF generation fails
    }

    return res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      appointment
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all appointments for a user
export const getUserAppointments = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId to avoid Mongoose cast error
    if (!userId || userId === 'undefined' || userId === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing user ID'
      });
    }
    
    // Find all appointments for the user
    const appointments = await appointmentModel.find({ userId })
      .populate('doctorId', 'name speciality image fees address')
      .sort({ appointmentDate: 1 });
    
    return res.status(200).json({
      success: true,
      appointments
    });
  } catch (error) {
    console.error('Error fetching user appointments:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all appointments for a doctor
export const getDoctorAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    // Validate doctorId to avoid Mongoose cast error
    if (!doctorId || doctorId === 'undefined' || doctorId === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing doctor ID'
      });
    }
    
    const appointments = await appointmentModel.find({ doctorId })
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .populate('userId', 'name email phone')
      .exec();
    
    return res.status(200).json({
      success: true,
      appointments
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor appointments',
      error: error.message
    });
  }
};

// Get all appointments (for admin)
export const getAllAppointments = async (req, res) => {
  try {
    // Find all appointments
    const appointments = await appointmentModel.find({})
      .populate('doctorId', 'name speciality image fees')
      .populate('userId', 'name email image phone')
      .sort({ appointmentDate: -1 }); // Most recent first
    
    return res.status(200).json({
      success: true,
      appointments
    });
  } catch (error) {
    console.error('Error fetching all appointments:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update appointment status
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;
    
    // Validate appointmentId
    if (!appointmentId || appointmentId === 'undefined' || appointmentId === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing appointment ID'
      });
    }
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment status'
      });
    }
    
    const appointment = await appointmentModel.findByIdAndUpdate(
      appointmentId,
      { status },
      { new: true }
    ).populate('userId', 'name email phone')
     .populate('doctorId', 'name email speciality address phone');
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // If status is confirmed, generate a new appointment slip
    if (status === 'confirmed' || status === 'completed') {
      try {
        const pdfPath = await generateAppointmentSlipPdf(appointment);
        console.log(`Updated appointment slip PDF generated: ${pdfPath}`);
      } catch (pdfError) {
        console.error('Error generating updated appointment slip PDF:', pdfError);
        // Continue with the success response even if PDF generation fails
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Appointment status updated successfully',
      appointment
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create Razorpay order for appointment payment
export const createPaymentOrder = async (req, res) => {
  try {
    // Check if Razorpay is initialized
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment service is currently unavailable. Please try again later or pay at the clinic.'
      });
    }
    
    const { appointmentId } = req.params;
    
    // Validate appointmentId
    if (!appointmentId || appointmentId === 'undefined' || appointmentId === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing appointment ID'
      });
    }
    
    // Find the appointment
    const appointment = await appointmentModel.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if payment is already completed
    if (appointment.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed for this appointment'
      });
    }
    
    // Create Razorpay order
    const options = {
      amount: Math.round(appointment.fees * 100), // amount in smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_order_${appointmentId}`,
      notes: {
        appointmentId: appointmentId
      }
    };
    
    const order = await razorpay.orders.create(options);
    
    return res.status(200).json({
      success: true,
      order,
      key_id: process.env.RAZORPAY_KEY_ID,
      appointment: {
        id: appointment._id,
        fees: appointment.fees
      }
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Verify Razorpay payment
export const verifyPayment = async (req, res) => {
  try {
    // Check if Razorpay is initialized
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment verification service is currently unavailable.'
      });
    }
    
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointmentId } = req.body;
    
    // Validate appointmentId
    if (!appointmentId || appointmentId === 'undefined' || appointmentId === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing appointment ID'
      });
    }
    
    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");
    
    const isSignatureValid = expectedSignature === razorpay_signature;
    
    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }
    
    // Update appointment payment status
    const appointment = await appointmentModel.findByIdAndUpdate(
      appointmentId,
      {
        paymentStatus: 'completed',
        paymentMethod: 'online'
      },
      { new: true }
    ).populate('doctorId').populate('userId');
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Create payment record
    const payment = new paymentModel({
      appointmentId: appointment._id,
      userId: appointment.userId._id,
      doctorId: appointment.doctorId._id,
      amount: appointment.fees,
      paymentMethod: 'online',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: 'completed'
    });
    
    await payment.save();
    
    // Send appointment confirmation email to the user
    try {
      const userEmail = appointment.userId.email;
      const appointmentDetails = {
        patientName: appointment.userId.name,
        doctorName: appointment.doctorId.name,
        doctorSpeciality: appointment.doctorId.speciality,
        date: appointment.appointmentDate,
        time: appointment.appointmentTime,
        appointmentType: 'Consultation',
        appointmentId: appointment.appointmentId
      };
      
      await sendAppointmentConfirmation(userEmail, appointmentDetails);
    } catch (emailError) {
      console.error('Failed to send appointment confirmation email:', emailError);
      // Continue with the success response even if email fails
    }
    
    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      appointment,
      payment
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
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
    const { appointmentId } = req.params;
    const { paymentStatus, paymentMethod } = req.body;
    
    // Validate appointmentId
    if (!appointmentId || appointmentId === 'undefined' || appointmentId === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing appointment ID'
      });
    }
    
    // Validate payment status
    const validPaymentStatuses = ['pending', 'completed', 'refunded'];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status value'
      });
    }
    
    // Find and update the appointment
    const updateData = { paymentStatus };
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }
    
    // Populate doctor and user details for email
    const appointment = await appointmentModel.findByIdAndUpdate(
      appointmentId,
      updateData,
      { new: true }
    ).populate('doctorId').populate('userId');
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if there's an existing payment record for this appointment
    let payment = await paymentModel.findOne({ appointmentId });
    
    if (payment) {
      // Update existing payment record
      payment.status = paymentStatus;
      if (paymentMethod) {
        payment.paymentMethod = paymentMethod;
      }
      await payment.save();
    } else if (paymentStatus === 'completed') {
      // Create new payment record if status is completed
      payment = new paymentModel({
        appointmentId: appointment._id,
        userId: appointment.userId._id,
        doctorId: appointment.doctorId._id,
        amount: appointment.fees,
        paymentMethod: paymentMethod || 'online',
        status: paymentStatus
      });
      await payment.save();
    }
    
    // Send appointment confirmation email if payment is marked as completed
    if (paymentStatus === 'completed') {
      try {
        const userEmail = appointment.userId.email;
        const appointmentDetails = {
          patientName: appointment.userId.name,
          doctorName: appointment.doctorId.name,
          doctorSpeciality: appointment.doctorId.speciality,
          date: appointment.appointmentDate,
          time: appointment.appointmentTime,
          appointmentType: 'Consultation',
          appointmentId: appointment.appointmentId
        };
        
        await sendAppointmentConfirmation(userEmail, appointmentDetails);
      } catch (emailError) {
        console.error('Failed to send appointment confirmation email:', emailError);
        // Continue with the success response even if email fails
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      appointment,
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

// Delete appointment
export const deleteAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    // Validate appointmentId
    if (!appointmentId || appointmentId === 'undefined' || appointmentId === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing appointment ID'
      });
    }
    
    const appointment = await appointmentModel.findByIdAndDelete(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}; 

// Download appointment slip
export const downloadAppointmentSlip = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    // Validate appointmentId
    if (!appointmentId || appointmentId === 'undefined' || appointmentId === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing appointment ID'
      });
    }
    
    // Find the appointment and populate related data
    const appointment = await appointmentModel.findById(appointmentId)
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name email speciality address phone');
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if PDF already exists
    const pdfDir = path.join(__dirname, '../pdfs');
    const pdfPath = path.join(pdfDir, `appointment_${appointmentId}.pdf`);
    
    let finalPdfPath;
    
    try {
      // Check if file exists
      await fs.access(pdfPath);
      finalPdfPath = pdfPath;
    } catch (error) {
      // PDF doesn't exist, generate it
      finalPdfPath = await generateAppointmentSlipPdf(appointment);
    }
    
    // Send the PDF file
    return res.download(finalPdfPath, `prescripto_appointment_${appointment.appointmentId}.pdf`);
  } catch (error) {
    console.error('Error downloading appointment slip:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};