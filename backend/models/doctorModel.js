import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    speciality: {
      type: String,
      required: true,
    },
    degree: {
      type: String,
      required: true,
    },
    experience: {
      type: String,
      required: true,
    },
    about: { 
      type: String,
      required: true 
    },
    available: { 
      type: Boolean, 
      required: true 
    },
    fees: { 
      type: Number, 
      required: true 
    },
    address: { 
      type: Object, 
      required: true
    },
    createdAt: { 
      type: Date, 
      required: true,
      default: () => new Date()
    },
    slots_booked: { 
      type: Object, 
      default: {} 
    },
    // Review fields
    averageRating: {
      type: Number,
      default: 0
    },
    reviewsCount: {
      type: Number,
      default: 0
    },
    // OTP verification fields
    isVerified: { type: Boolean, default: false },
    otpHash: { type: String },
    otpExpiry: { type: Date },
    passwordResetOtpHash: { type: String },
    passwordResetOtpExpiry: { type: Date }
  },
  { minimize: false }
);

const doctorModel =
  mongoose.models.doctor || mongoose.model("doctor", doctorSchema);

export default doctorModel;
