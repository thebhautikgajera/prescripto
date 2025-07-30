import express from "express";
import { 
  loginDoctor, 
  logoutDoctor, 
  getAllDoctors, 
  getDoctorById, 
  getDoctorProfile, 
  updateDoctorProfile,
  updateDoctorAvailability,
  changeDoctorPassword,
  verifyDoctorOTP,
  resendDoctorOTP,
  forgotDoctorPassword,
  resetDoctorPassword
} from "../controllers/doctorController.js";
import { authenticateToken, isDoctor } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/multer.js";

const doctorRouter = express.Router();

// Public routes
doctorRouter.post("/login", loginDoctor);
doctorRouter.get("/all", getAllDoctors);
doctorRouter.post("/verify-otp", verifyDoctorOTP);
doctorRouter.post("/resend-otp", resendDoctorOTP);
doctorRouter.post("/forgot-password", forgotDoctorPassword);
doctorRouter.post("/reset-password", resetDoctorPassword);

// Protected routes
doctorRouter.post("/logout", authenticateToken, logoutDoctor);
doctorRouter.get("/profile/me", authenticateToken, isDoctor, getDoctorProfile);
doctorRouter.put("/profile/update", authenticateToken, isDoctor, upload.single("image"), updateDoctorProfile);
doctorRouter.patch("/availability", authenticateToken, isDoctor, updateDoctorAvailability);
doctorRouter.post("/change-password", authenticateToken, isDoctor, changeDoctorPassword);

// This route must be last to avoid conflicts with other routes that start with '/'
doctorRouter.get("/:id", getDoctorById);

export default doctorRouter;
