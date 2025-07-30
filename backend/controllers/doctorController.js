import doctorModel from '../models/doctorModel.js';
import bcrypt from 'bcrypt';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { generateToken } from '../utils/jwtUtils.js';
import { generateOTP, sendOTP, hashOTP, verifyOTP } from '../utils/emailUtils.js';

// API to get all doctors (public)
const getAllDoctors = async (req, res) => {
  try {
    // Get all doctors from database
    const doctors = await doctorModel.find({ available: true }, {
      password: 0 // Exclude password field from results
    });
    
    // Format the response
    const formattedDoctors = doctors.map(doctor => ({
      _id: doctor._id,
      name: doctor.name,
      speciality: doctor.speciality,
      degree: doctor.degree,
      experience: doctor.experience,
      about: doctor.about,
      fees: doctor.fees,
      image: doctor.image,
      address: doctor.address,
      contactNumber: doctor.contactNumber,
      averageRating: doctor.averageRating || 0,
      reviewsCount: doctor.reviewsCount || 0
    }));
    
    // Return success response
    res.status(200).json({
      success: true,
      doctors: formattedDoctors
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctors",
      error: error.message
    });
  }
};

// API to get a doctor by ID (public)
const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get doctor from database
    const doctor = await doctorModel.findById(id, {
      password: 0 // Exclude password field from results
    });
    
    // Check if doctor exists
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }
    
    // Format the response
    const formattedDoctor = {
      _id: doctor._id,
      name: doctor.name,
      speciality: doctor.speciality,
      degree: doctor.degree,
      experience: doctor.experience,
      about: doctor.about,
      fees: doctor.fees,
      image: doctor.image,
      address: doctor.address,
      contactNumber: doctor.contactNumber,
      averageRating: doctor.averageRating || 0,
      reviewsCount: doctor.reviewsCount || 0
    };
    
    // Return success response
    res.status(200).json({
      success: true,
      doctor: formattedDoctor
    });
  } catch (error) {
    console.error("Error fetching doctor:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctor",
      error: error.message
    });
  }
};

// API to get doctor's own profile (authenticated)
const getDoctorProfile = async (req, res) => {
  try {
    // Get doctor ID from authenticated user
    const doctorId = req.user.id;
    
    // Get doctor from database
    const doctor = await doctorModel.findById(doctorId, {
      password: 0 // Exclude password field from results
    });
    
    // Check if doctor exists
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }
    
    // Return success response with full doctor details
    res.status(200).json({
      success: true,
      doctor: doctor
    });
  } catch (error) {
    console.error("Error fetching doctor profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctor profile",
      error: error.message
    });
  }
};

// API for doctor login
const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request body
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Find doctor by email
    const doctor = await doctorModel.findOne({ email });
    
    // Check if doctor exists
    if (!doctor) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Check if doctor is verified
    if (!doctor.isVerified) {
      // Generate new OTP for unverified doctors
      const otp = generateOTP();
      const otpExpiry = new Date();
      otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);
      
      // Hash the OTP before storing
      const otpHash = await hashOTP(otp);
      
      doctor.otpHash = otpHash;
      doctor.otpExpiry = otpExpiry;
      await doctor.save();
      
      // Send OTP via email
      await sendOTP(email, otp, 'verification');
      
      return res.status(403).json({
        success: false,
        message: 'Email not verified. A new OTP has been sent to your email.',
        requiresVerification: true
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, doctor.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Generate JWT token
    const token = generateToken(doctor._id, "doctor");

    // Return success response with doctor details (excluding sensitive info)
    res.status(200).json({
      success: true,
      message: "Login successful",
      doctor: {
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        speciality: doctor.speciality,
        degree: doctor.degree,
        experience: doctor.experience,
        image: doctor.image,
        available: doctor.available,
        contactNumber: doctor.contactNumber
      },
      token
    });
  } catch (error) {
    console.error("Error in doctor login:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message
    });
  }
};

// API for doctor logout
const logoutDoctor = async (req, res) => {
  try {
    // In a production environment, you would invalidate the token here
    // For example, by adding it to a blacklist in Redis or database
    
    // For now, we'll just return a success response
    // The actual token invalidation happens on the client side
    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("Error in doctor logout:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
      error: error.message
    });
  }
};

// Verify doctor OTP
const verifyDoctorOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find doctor by email
    const doctor = await doctorModel.findOne({ email });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check if OTP is expired
    if (doctor.otpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    // Verify OTP against stored hash
    const isValidOTP = await verifyOTP(otp, doctor.otpHash);
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Mark doctor as verified
    doctor.isVerified = true;
    doctor.otpHash = undefined;
    doctor.otpExpiry = undefined;
    await doctor.save();

    // Generate JWT token
    const token = generateToken(doctor._id, 'doctor');

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      token,
      doctor: {
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        speciality: doctor.speciality,
        degree: doctor.degree,
        experience: doctor.experience,
        image: doctor.image,
        available: doctor.available,
        contactNumber: doctor.contactNumber
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
      error: error.message
    });
  }
};

// Resend OTP for doctor
const resendDoctorOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Find doctor by email
    const doctor = await doctorModel.findOne({ email });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP expires in 10 minutes

    // Hash the OTP before storing
    const otpHash = await hashOTP(otp);

    // Update doctor with new OTP
    doctor.otpHash = otpHash;
    doctor.otpExpiry = otpExpiry;
    await doctor.save();

    // Send OTP via email
    await sendOTP(email, otp, 'verification');

    res.status(200).json({
      success: true,
      message: 'OTP resent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resending OTP',
      error: error.message
    });
  }
};

// Forgot password - send OTP for doctor
const forgotDoctorPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find doctor by email
    const doctor = await doctorModel.findOne({ email });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Generate OTP for password reset
    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP expires in 10 minutes

    // Hash the OTP before storing
    const otpHash = await hashOTP(otp);

    // Update doctor with password reset OTP
    doctor.passwordResetOtpHash = otpHash;
    doctor.passwordResetOtpExpiry = otpExpiry;
    await doctor.save();

    // Send OTP via email
    await sendOTP(email, otp, 'password-reset');

    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to your email'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending password reset OTP',
      error: error.message
    });
  }
};

// Reset password with OTP for doctor
const resetDoctorPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Find doctor by email
    const doctor = await doctorModel.findOne({ email });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check if OTP is expired
    if (doctor.passwordResetOtpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    // Verify OTP against stored hash
    const isValidOTP = await verifyOTP(otp, doctor.passwordResetOtpHash);
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update doctor password
    doctor.password = hashedPassword;
    doctor.passwordResetOtpHash = undefined;
    doctor.passwordResetOtpExpiry = undefined;
    await doctor.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};

// API to update doctor's own profile (authenticated)
const updateDoctorProfile = async (req, res) => {
  try {
    // Get doctor ID from authenticated user
    const doctorId = req.user.id;
    
    // Get doctor from database
    const doctor = await doctorModel.findById(doctorId);
    
    // Check if doctor exists
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }
    
    // Update fields from request body
    const { name, contactNumber, speciality, degree, experience, about, fees, address } = req.body;
    
    // Update basic fields if provided
    if (name) doctor.name = name;
    if (contactNumber) doctor.contactNumber = contactNumber;
    if (speciality) doctor.speciality = speciality;
    if (degree) doctor.degree = degree;
    if (experience) doctor.experience = experience;
    if (about) doctor.about = about;
    if (fees) doctor.fees = Number(fees);
    
    // Update address if provided
    if (address) {
      try {
        const addressObj = typeof address === 'string' ? JSON.parse(address) : address;
        doctor.address = addressObj;
      } catch (error) {
        console.error("Error parsing address:", error);
        return res.status(400).json({
          success: false,
          message: "Invalid address format"
        });
      }
    }
    
    // Handle image upload if provided
    if (req.file) {
      try {
        // Upload image to cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "doctors",
          width: 300,
          crop: "scale"
        });
        
        // Update doctor image
        doctor.image = result.secure_url;
      } catch (error) {
        console.error("Error uploading image:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to upload image",
          error: error.message
        });
      }
    }
    
    // Save updated doctor
    await doctor.save();
    
    // Return success response
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      doctor: {
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        contactNumber: doctor.contactNumber,
        speciality: doctor.speciality,
        degree: doctor.degree,
        experience: doctor.experience,
        about: doctor.about,
        fees: doctor.fees,
        image: doctor.image,
        address: doctor.address,
        available: doctor.available
      }
    });
  } catch (error) {
    console.error("Error updating doctor profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message
    });
  }
};

// API to update doctor's availability
const updateDoctorAvailability = async (req, res) => {
  try {
    // Get doctor ID from authenticated user
    const doctorId = req.user.id;
    
    // Get doctor from database
    const doctor = await doctorModel.findById(doctorId);
    
    // Check if doctor exists
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }
    
    // Update availability from request body
    const { available } = req.body;
    
    // Check if available is provided and is a boolean
    if (available === undefined || typeof available !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: "Available status must be a boolean value"
      });
    }
    
    // Update doctor availability
    doctor.available = available;
    
    // Save updated doctor
    await doctor.save();
    
    // Return success response
    res.status(200).json({
      success: true,
      message: `Doctor is now ${available ? 'available' : 'unavailable'} for appointments`,
      available: doctor.available
    });
  } catch (error) {
    console.error("Error updating doctor availability:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update availability",
      error: error.message
    });
  }
};

// API to change doctor's password
const changeDoctorPassword = async (req, res) => {
  try {
    // Get doctor ID from authenticated user
    const doctorId = req.user.id;
    
    // Get doctor from database
    const doctor = await doctorModel.findById(doctorId);
    
    // Check if doctor exists
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }
    
    // Get passwords from request body
    const { currentPassword, newPassword } = req.body;
    
    // Validate request body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required"
      });
    }
    
    // Check if current password is correct
    const isPasswordValid = await bcrypt.compare(currentPassword, doctor.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect"
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update doctor password
    doctor.password = hashedPassword;
    
    // Save updated doctor
    await doctor.save();
    
    // Return success response
    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("Error changing doctor password:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: error.message
    });
  }
};

// Export all functions
export {
  getAllDoctors,
  getDoctorById,
  getDoctorProfile,
  loginDoctor,
  logoutDoctor,
  updateDoctorProfile,
  updateDoctorAvailability,
  changeDoctorPassword,
  verifyDoctorOTP,
  resendDoctorOTP,
  forgotDoctorPassword,
  resetDoctorPassword
};
