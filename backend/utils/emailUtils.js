import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import { 
  generateOTPEmailTemplate, 
  generateAppointmentEmailTemplate,
  generateWelcomeEmailTemplate 
} from './mjmlTemplates.js';

// Create a transporter for sending emails
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Mock email service for development/testing (without real email sending)
const mockSendOTP = (email, otp, purpose) => {

  return Promise.resolve({ 
    success: true, 
    message: 'Mock email sent successfully'
  });
};

// Generate a random 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Hash an OTP for secure storage
export const hashOTP = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(otp, salt);
};

// Verify an OTP against its hash
export const verifyOTP = async (otp, hash) => {
  return await bcrypt.compare(otp, hash);
};

// Send OTP via email
export const sendOTP = async (email, otp, purpose = 'verification') => {
  try {
    // Force development mode for testing if not in production
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    // Check if email configuration exists
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('Email configuration is missing. Using mock email service instead.');
      return mockSendOTP(email, otp, purpose);
    }
    
    // If we're in development mode, always log the OTP to console for testing
    if (isDevelopment) {
  
    }
    
    const transporter = createTransporter();
    
    // Generate email content using MJML template
    const html = generateOTPEmailTemplate(otp, purpose);
    let subject = `Prescripto - OTP for ${purpose}`;
    
    if (purpose === 'verification') {
      subject = 'Prescripto - Email Verification OTP';
    } else if (purpose === 'password-reset') {
      subject = 'Prescripto - Password Reset OTP';
    }
    
    // Generate plain text version as fallback
    const text = `Your OTP for ${purpose} is: ${otp}. This OTP will expire in 10 minutes.`;

    // Send email
    const info = await transporter.sendMail({
      from: `"Prescripto" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      text,
      html
    });

    return {
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Error sending email:', error);
    
    // If we're in development mode, don't throw an error for email failures
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Email sending failed, but continuing in development mode');
      return {
        success: true,
        message: 'Email would have been sent in production',
        error: error.message
      };
    }
    
    throw error;
  }
}; 

// Send appointment confirmation email
export const sendAppointmentConfirmation = async (email, appointmentDetails) => {
  try {
    // Force development mode for testing if not in production
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    // Check if email configuration exists
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('Email configuration is missing. Using mock email service instead.');
      return {
        success: true,
        message: 'Mock appointment email would be sent'
      };
    }
    
    const transporter = createTransporter();
    
    // Generate email content using MJML template
    const html = generateAppointmentEmailTemplate(appointmentDetails);
    const subject = 'Prescripto - Appointment Confirmation';
    
    // Generate plain text version as fallback
    const text = `
      Your appointment has been confirmed.
      Patient: ${appointmentDetails.patientName}
      Doctor: ${appointmentDetails.doctorName}
      Specialty: ${appointmentDetails.doctorSpeciality}
      Date: ${new Date(appointmentDetails.date).toLocaleDateString()}
      Time: ${appointmentDetails.time}
      Type: ${appointmentDetails.appointmentType}
      Appointment ID: ${appointmentDetails.appointmentId}
    `;

    // Send email
    const info = await transporter.sendMail({
      from: `"Prescripto" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      text,
      html
    });

    return {
      success: true,
      message: 'Appointment confirmation email sent successfully',
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Error sending appointment email:', error);
    
    // If we're in development mode, don't throw an error for email failures
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Email sending failed, but continuing in development mode');
      return {
        success: true,
        message: 'Appointment email would have been sent in production',
        error: error.message
      };
    }
    
    throw error;
  }
}; 

// Send welcome email to new users
export const sendWelcomeEmail = async (email, userDetails) => {
  try {
    // Force development mode for testing if not in production
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    // Check if email configuration exists
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('Email configuration is missing. Using mock email service instead.');
      return {
        success: true,
        message: 'Mock welcome email would be sent'
      };
    }
    
    const transporter = createTransporter();
    
    // Generate email content using MJML template
    const html = generateWelcomeEmailTemplate(userDetails);
    const subject = 'Welcome to Prescripto!';
    
    // Generate plain text version as fallback
    const text = `
      Welcome to Prescripto, ${userDetails.name}!
      
      Thank you for joining Prescripto. We're excited to have you on board!
      
      With Prescripto, you can:
      • Book appointments with top doctors
      • Manage your medical records securely
      • Get prescriptions online
      • Access healthcare services 24/7
      
      Get started now at https://prescriptocare.vercel.app/login
      
      If you have any questions or need assistance, please contact our support team.
      
      Thank you,
      The Prescripto Team
    `;

    // Send email
    const info = await transporter.sendMail({
      from: `"Prescripto" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      text,
      html
    });

    return {
      success: true,
      message: 'Welcome email sent successfully',
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    
    // If we're in development mode, don't throw an error for email failures
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Email sending failed, but continuing in development mode');
      return {
        success: true,
        message: 'Welcome email would have been sent in production',
        error: error.message
      };
    }
    
    throw error;
  }
}; 