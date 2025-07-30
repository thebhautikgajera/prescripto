import userModel from '../models/userModel.js';
import bcrypt from 'bcrypt';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { generateToken } from '../utils/jwtUtils.js';
import { generateOTP, sendOTP, hashOTP, verifyOTP } from '../utils/emailUtils.js';

// Register a new user
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP expires in 10 minutes

    // Hash the OTP before storing in database
    const otpHash = await hashOTP(otp);

    // Create new user
    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      phone,
      otpHash,
      otpExpiry,
      isVerified: false
    });

    await newUser.save();

    // Send OTP via email
    await sendOTP(email, otp, 'verification');

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email with the OTP sent.',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// Verify user OTP
export const verifyUserOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find user by email
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if OTP is expired
    if (user.otpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    // Check if OTP is valid using secure comparison
    const isValidOTP = await verifyOTP(otp, user.otpHash);
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Mark user as verified
    user.isVerified = true;
    user.otpHash = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id, 'user');

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image
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

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP expires in 10 minutes

    // Hash the OTP before storing
    const otpHash = await hashOTP(otp);

    // Update user with new OTP
    user.otpHash = otpHash;
    user.otpExpiry = otpExpiry;
    await user.save();

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

// Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      // Generate new OTP for unverified users
      const otp = generateOTP();
      const otpExpiry = new Date();
      otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);
      
      // Hash the OTP before storing
      const otpHash = await hashOTP(otp);
      
      user.otpHash = otpHash;
      user.otpExpiry = otpExpiry;
      await user.save();
      
      // Send OTP via email
      await sendOTP(email, otp, 'verification');
      
      return res.status(403).json({
        success: false,
        message: 'Email not verified. A new OTP has been sent to your email.',
        requiresVerification: true
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user._id, 'user');

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// Forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate OTP for password reset
    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP expires in 10 minutes

    // Hash the OTP before storing
    const otpHash = await hashOTP(otp);

    // Save OTP to user
    user.passwordResetOtpHash = otpHash;
    user.passwordResetOtpExpiry = otpExpiry;
    await user.save();

    // Send OTP via email
    await sendOTP(email, otp, 'password-reset');

    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to email'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending password reset OTP',
      error: error.message
    });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Find user by email
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if OTP is expired
    if (user.passwordResetOtpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    // Verify OTP
    const isValidOTP = await verifyOTP(otp, user.passwordResetOtpHash);
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    user.password = hashedPassword;
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpiry = undefined;
    await user.save();

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

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    // User ID is available in req.user.id from the auth middleware
    const userId = req.user.id;
    
    const user = await userModel.findById(userId).select('-password -otpHash -otpExpiry -passwordResetOtpHash -passwordResetOtpExpiry');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { name, phone, gender, dob, bloodGroup, address } = req.body;
    
    // Find user
    const user = await userModel.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (gender) user.gender = gender;
    if (dob) user.dob = dob;
    if (bloodGroup) user.bloodGroup = bloodGroup;
    if (address) user.address = address;
    
    // If image is provided in request, upload to Cloudinary
    if (req.file && req.file.path) {
      try {
        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "users",
          width: 300,
          crop: "scale"
        });
        
        // Update user with Cloudinary URL
        user.image = result.secure_url;
        
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
          message: "Failed to upload profile image",
          error: uploadError.message
        });
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        phone: user.phone,
        gender: user.gender,
        dob: user.dob,
        bloodGroup: user.bloodGroup,
        address: user.address
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Change email during verification process
export const changeVerificationEmail = async (req, res) => {
  try {
    const { oldEmail, newEmail } = req.body;

    // Validate input
    if (!oldEmail || !newEmail) {
      return res.status(400).json({
        success: false,
        message: 'Both old and new email addresses are required'
      });
    }

    // Check if old email exists
    const existingUser = await userModel.findOne({ email: oldEmail });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'No account found with the original email address'
      });
    }

    // Make sure user is not already verified
    if (existingUser.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'This account is already verified. Please login or use the forgot password feature.'
      });
    }

    // Check if new email is already in use by another account
    const newEmailUser = await userModel.findOne({ email: newEmail });
    if (newEmailUser) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered. Please use a different email address.'
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP expires in 10 minutes

    // Hash the OTP before storing
    const otpHash = await hashOTP(otp);

    // Update user email and OTP
    existingUser.email = newEmail;
    existingUser.otpHash = otpHash;
    existingUser.otpExpiry = otpExpiry;
    await existingUser.save();

    // Send OTP to new email
    await sendOTP(newEmail, otp, 'verification');

    res.status(200).json({
      success: true,
      message: 'Email address updated successfully. A new verification code has been sent to your new email.',
      email: newEmail
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error changing email address',
      error: error.message
    });
  }
};
