import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: "admin"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // OTP verification fields
  isVerified: { type: Boolean, default: false },
  otpHash: { type: String },
  otpExpiry: { type: Date },
  passwordResetOtpHash: { type: String },
  passwordResetOtpExpiry: { type: Date }
});

const adminModel = mongoose.models.admin || mongoose.model("admin", adminSchema);
export default adminModel; 