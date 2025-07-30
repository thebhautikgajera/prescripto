import express from "express";
import { 
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
} from "../controllers/adminController.js";
import { authenticateToken, isAdmin } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/multer.js";

const adminRouter = express.Router();

// Public routes
adminRouter.post("/register", registerAdmin);
adminRouter.post("/login", loginAdmin);
adminRouter.post("/verify-otp", verifyAdminOTP);
adminRouter.post("/resend-otp", resendAdminOTP);
adminRouter.post("/forgot-password", forgotAdminPassword);
adminRouter.post("/reset-password", resetAdminPassword);

// Protected routes - require admin authentication
adminRouter.post("/logout", authenticateToken, isAdmin, logoutAdmin);
adminRouter.post("/change-password", authenticateToken, isAdmin, changeAdminPassword);

// Doctor management routes
adminRouter.post("/add-doctor", authenticateToken, isAdmin, upload.single('image'), addDoctor);

// Doctor management routes
adminRouter.get("/doctors", authenticateToken, isAdmin, getAllDoctors);
adminRouter.get("/doctors/:id", authenticateToken, isAdmin, getDoctorById);
adminRouter.patch("/doctors/:id/availability", authenticateToken, isAdmin, updateDoctorAvailability);
adminRouter.delete("/doctors/:id", authenticateToken, isAdmin, deleteDoctor);
adminRouter.put("/doctors/:id", authenticateToken, isAdmin, upload.single('image'), updateDoctor);

// Patient management routes
adminRouter.get("/patients", authenticateToken, isAdmin, getAllPatients);

export default adminRouter;
