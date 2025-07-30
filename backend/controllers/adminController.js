import doctorModel from "../models/doctorModel.js";
import adminModel from "../models/adminModel.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwtUtils.js";
import userModel from "../models/userModel.js";
import { generateOTP, sendOTP, hashOTP, verifyOTP } from '../utils/emailUtils.js';

// API for admin registration
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate request body
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    // Check if admin already exists
    const existingAdmin = await adminModel.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "Admin with this email already exists"
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP expires in 10 minutes

    // Hash the OTP before storing
    const otpHash = await hashOTP(otp);

    // Create new admin
    const newAdmin = new adminModel({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      otpHash,
      otpExpiry,
      isVerified: false
    });

    // Save admin to database
    const savedAdmin = await newAdmin.save();

    // Send OTP via email
    await sendOTP(email, otp, 'verification');

    // Return success response
    res.status(201).json({
      success: true,
      message: "Admin registered successfully. Please verify your email with the OTP sent.",
      admin: {
        id: savedAdmin._id,
        name: savedAdmin.name,
        email: savedAdmin.email,
        role: savedAdmin.role
      }
    });
  } catch (error) {
    console.error("Error in admin registration:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message
    });
  }
};

// Verify admin OTP
const verifyAdminOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find admin by email
    const admin = await adminModel.findOne({ email });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check if OTP is expired
    if (admin.otpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    // Verify OTP against stored hash
    const isValidOTP = await verifyOTP(otp, admin.otpHash);
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Mark admin as verified
    admin.isVerified = true;
    admin.otpHash = undefined;
    admin.otpExpiry = undefined;
    await admin.save();

    // Generate JWT token
    const token = generateToken(admin._id, admin.role);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
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

// Resend OTP for admin
const resendAdminOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Find admin by email
    const admin = await adminModel.findOne({ email });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP expires in 10 minutes

    // Hash the new OTP
    const otpHash = await hashOTP(otp);

    // Update admin with new OTP
    admin.otpHash = otpHash; // Changed from admin.otp to admin.otpHash
    admin.otpExpiry = otpExpiry;
    await admin.save();

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

// API for admin login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request body
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Find admin by email
    const admin = await adminModel.findOne({ email });
    
    // Check if admin exists
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Check if admin is verified
    if (!admin.isVerified) {
      // Generate new OTP for unverified admins
      const otp = generateOTP();
      const otpExpiry = new Date();
      otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);
      
      const otpHash = await hashOTP(otp); // Hash the new OTP
      admin.otpHash = otpHash; // Update admin with new OTP hash
      admin.otpExpiry = otpExpiry;
      await admin.save();
      
      // Send OTP via email
      await sendOTP(email, otp, 'verification');
      
      return res.status(403).json({
        success: false,
        message: 'Email not verified. A new OTP has been sent to your email.',
        requiresVerification: true
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Generate JWT token
    const token = generateToken(admin._id, admin.role);

    // Return success response with admin details
    res.status(200).json({
      success: true,
      message: "Login successful",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      },
      token
    });
  } catch (error) {
    console.error("Error in admin login:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message
    });
  }
};

// Forgot password - send OTP for admin
const forgotAdminPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find admin by email
    const admin = await adminModel.findOne({ email });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Generate OTP for password reset
    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP expires in 10 minutes

    // Hash the OTP for password reset
    const otpHash = await hashOTP(otp);

    // Update admin with password reset OTP
    admin.passwordResetOtpHash = otpHash; // Changed from admin.passwordResetOtp to admin.passwordResetOtpHash
    admin.passwordResetOtpExpiry = otpExpiry;
    await admin.save();

    // Send OTP via email
    await sendOTP(email, otp, 'reset');

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

// Reset password with OTP for admin
const resetAdminPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Find admin by email
    const admin = await adminModel.findOne({ email });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check if OTP is expired
    if (admin.passwordResetOtpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    // Verify OTP against stored hash
    const isValidOTP = await verifyOTP(otp, admin.passwordResetOtpHash);
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update admin password
    admin.password = hashedPassword;
    admin.passwordResetOtpHash = undefined;
    admin.passwordResetOtpExpiry = undefined;
    await admin.save();

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

// API for adding doctor
const addDoctor = async (req, res) => {
  try {
    // Extract all required fields from request body
    const {
      name,
      email,
      password,
      contactNumber,
      speciality,
      degree,
      experience,
      about,
      fees,
      address,
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !contactNumber || !speciality || !degree || 
        !experience || !about || !fees || !address) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
      });
    }

    // Check if email already exists
    const existingDoctor = await doctorModel.findOne({ email });
    if (existingDoctor) {
      return res.status(409).json({ 
        success: false, 
        message: "Doctor with this email already exists" 
      });
    }

    // Validate image upload - improved error handling
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "Doctor image is required. Please upload an image file." 
      });
    }

    let imageUrl;
    try {
      // Upload image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "doctors",
        width: 300,
        crop: "scale"
      });
      imageUrl = result.secure_url;
      
      // Remove temporary file after upload
      fs.unlinkSync(req.file.path);
    } catch (uploadError) {
      console.error("Error uploading to Cloudinary:", uploadError);
      
      // Try to clean up temporary file if it exists
      try {
        if (req.file && req.file.path) {
          fs.unlinkSync(req.file.path);
        }
      } catch (cleanupError) {
        console.error("Error cleaning up temporary file:", cleanupError);
      }
      
      return res.status(500).json({
        success: false,
        message: "Failed to upload doctor image",
        error: uploadError.message
      });
    }

    // Parse address if it's a string
    let parsedAddress;
    try {
      parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid address format" 
      });
    }

    // Hash the doctor's password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new doctor object with isVerified set to true since admin is adding the doctor
    const newDoctor = new doctorModel({
      name,
      email,
      password: hashedPassword,
      contactNumber,
      image: imageUrl,
      speciality,
      degree,
      experience,
      about,
      fees: Number(fees),
      address: parsedAddress,
      available: true,
      isVerified: true // Set to true as the doctor is added by admin
    });

    // Save doctor to database
    const savedDoctor = await newDoctor.save();
    
    // Return success response
    res.status(201).json({ 
      success: true,
      message: "Doctor added successfully. The account is verified and ready to use.", 
      doctor: {
        id: savedDoctor._id,
        name: savedDoctor.name,
        email: savedDoctor.email,
        speciality: savedDoctor.speciality,
        image: savedDoctor.image
      }
    });
    
  } catch (error) {
    console.error("Error adding doctor:", error);
    
    // Try to clean up temporary file if it exists
    try {
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
    } catch (cleanupError) {
      console.error("Error cleaning up temporary file:", cleanupError);
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Failed to add doctor",
      error: error.message 
    });
  }
};

// API for admin logout
const logoutAdmin = async (req, res) => {
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
    console.error("Error in admin logout:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
      error: error.message
    });
  }
};

// API to get all doctors
const getAllDoctors = async (req, res) => {
  try {
    // Get all doctors from database
    const doctors = await doctorModel.find({}, {
      password: 0 // Exclude password field from results
    });
    
    // Format the response
    const formattedDoctors = doctors.map(doctor => ({
      id: doctor._id,
      name: doctor.name,
      email: doctor.email,
      speciality: doctor.speciality,
      degree: doctor.degree,
      experience: doctor.experience,
      fees: doctor.fees,
      image: doctor.image,
      available: doctor.available,
      address: doctor.address,
      about: doctor.about,
      joinedDate: doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric'
      }).replace(/\//g, '-') : "Unknown"
    }));
    
    // Return success response
    res.status(200).json({
      success: true,
      message: "Doctors fetched successfully",
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

// API to update doctor availability
const updateDoctorAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { available } = req.body;
    
    // Validate available is a boolean
    if (typeof available !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: "Available must be a boolean value (true or false)"
      });
    }
    
    // Update doctor availability
    const updatedDoctor = await doctorModel.findByIdAndUpdate(
      id,
      { available },
      { new: true, runValidators: true }
    );
    
    if (!updatedDoctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }
    
    // Return success response
    res.status(200).json({
      success: true,
      message: "Doctor availability updated successfully",
      doctor: {
        id: updatedDoctor._id,
        name: updatedDoctor.name,
        available: updatedDoctor.available
      }
    });
  } catch (error) {
    console.error("Error updating doctor availability:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update doctor availability",
      error: error.message
    });
  }
};

// API to delete doctor
const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find doctor to get image URL
    const doctor = await doctorModel.findById(id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }
    
    // Delete doctor from database
    await doctorModel.findByIdAndDelete(id);
    
    // If doctor has an image in Cloudinary, delete it
    if (doctor.image && doctor.image.includes('cloudinary')) {
      try {
        // Extract public_id from Cloudinary URL
        const publicId = doctor.image.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(`doctors/${publicId}`);
      } catch (cloudinaryError) {
        console.error("Error deleting image from Cloudinary:", cloudinaryError);
        // Continue with response even if image deletion fails
      }
    }
    
    // Return success response
    res.status(200).json({
      success: true,
      message: "Doctor deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete doctor",
      error: error.message
    });
  }
};

// API to get doctor by ID
const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find doctor by ID
    const doctor = await doctorModel.findById(id, { password: 0 }); // Exclude password
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }
    
    // Format the response
    const formattedDoctor = {
      id: doctor._id,
      name: doctor.name,
      email: doctor.email,
      contactNumber: doctor.contactNumber,
      speciality: doctor.speciality,
      degree: doctor.degree,
      experience: doctor.experience,
      about: doctor.about,
      fees: doctor.fees,
      image: doctor.image,
      available: doctor.available,
      address: doctor.address,
      joinedDate: doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'}).replace(/\//g, '-') : "Unknown"
    };
    
    // Return success response
    res.status(200).json({
      success: true,
      message: "Doctor fetched successfully",
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

// API to update doctor
const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      speciality,
      degree,
      experience,
      about,
      fees,
      address,
      contactNumber
    } = req.body;

    // Find doctor first to check if exists
    const doctor = await doctorModel.findById(id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    // Parse address if it's a string
    let parsedAddress;
    try {
      parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid address format" 
      });
    }

    // Create update fields object
    const updateFields = {
      name,
      email,
      speciality,
      degree,
      experience,
      about,
      fees: Number(fees),
      address: parsedAddress,
      contactNumber
    };

    // Handle image upload if provided
    if (req.file) {
      try {
        // If doctor already has an image in Cloudinary, delete it
        if (doctor.image && doctor.image.includes('cloudinary')) {
          try {
            // Extract public_id from Cloudinary URL
            const publicId = doctor.image.split('/').slice(-2).join('/').split('.')[0];
            await cloudinary.uploader.destroy(`doctors/${publicId}`);
          } catch (cloudinaryError) {
            console.error("Error deleting old image from Cloudinary:", cloudinaryError);
            // Continue with upload even if old image deletion fails
          }
        }

        // Upload new image to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "doctors",
          width: 300,
          crop: "scale"
        });
        updateFields.image = result.secure_url;
        
        // Remove temporary file after upload
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error("Error uploading to Cloudinary:", uploadError);
        
        // Try to clean up temporary file if it exists
        try {
          if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
          }
        } catch (cleanupError) {
          console.error("Error cleaning up temporary file:", cleanupError);
        }
        
        return res.status(500).json({
          success: false,
          message: "Failed to upload doctor image",
          error: uploadError.message
        });
      }
    }

    // Update doctor in database
    const updatedDoctor = await doctorModel.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    );
    
    // Return success response
    res.status(200).json({
      success: true,
      message: "Doctor updated successfully",
      doctor: {
        id: updatedDoctor._id,
        name: updatedDoctor.name,
        email: updatedDoctor.email,
        speciality: updatedDoctor.speciality,
        image: updatedDoctor.image
      }
    });
    
  } catch (error) {
    console.error("Error updating doctor:", error);
    
    // Try to clean up temporary file if it exists
    try {
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
    } catch (cleanupError) {
      console.error("Error cleaning up temporary file:", cleanupError);
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to update doctor",
      error: error.message
    });
  }
};

// API to get all patients
const getAllPatients = async (req, res) => {
  try {
    // Get all patients from database
    const patients = await userModel.find({}, {
      password: 0 // Exclude password field from results
    });
    
    // Format the response
    const formattedPatients = patients.map(patient => ({
      id: patient._id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone || "Not provided",
      gender: patient.gender || "Not specified",
      bloodGroup: patient.bloodGroup || "Not Specified",
      dob: patient.dob || "Not provided",
      address: patient.address || { 
        buildingNumber: "",
        streetName: "",
        area: "",
        landmark: "",
        city: "",
        state: "",
        pinCode: ""
      },
      image: patient.image || "",
      joinedDate: patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'}).replace(/\//g, '-') : "Unknown"
    }));
    
    // Return success response
    res.status(200).json({
      success: true,
      message: "Patients fetched successfully",
      patients: formattedPatients
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patients",
      error: error.message
    });
  }
};

// API to change admin's password
const changeAdminPassword = async (req, res) => {
  try {
    // Get admin ID from authenticated user
    const adminId = req.user.id;
    
    // Get admin from database
    const admin = await adminModel.findById(adminId);
    
    // Check if admin exists
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
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
    const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect"
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update admin password
    admin.password = hashedPassword;
    
    // Save updated admin
    await admin.save();
    
    // Return success response
    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("Error changing admin password:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: error.message
    });
  }
};

export { 
  registerAdmin, 
  loginAdmin, 
  addDoctor, 
  logoutAdmin, 
  getAllDoctors, 
  updateDoctorAvailability, 
  deleteDoctor, 
  getDoctorById, 
  updateDoctor, 
  getAllPatients,
  changeAdminPassword,
  verifyAdminOTP,
  resendAdminOTP,
  forgotAdminPassword,
  resetAdminPassword
}; 