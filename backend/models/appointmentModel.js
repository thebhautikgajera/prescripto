import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      unique: true,
      default: function() {
        // Default value will be created in controller before save
        return null;
      }
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctor",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    appointmentTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["online", "cash", "insurance"],
      default: "online",
    },
    fees: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const appointmentModel = mongoose.models.appointment || mongoose.model("appointment", appointmentSchema);

export default appointmentModel; 