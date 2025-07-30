import express from 'express';
import { analyzeSymptoms, getSymptomHistory } from '../controllers/aiController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// AI Symptom Checker route - requires user authentication
router.post('/symptom-checker', authenticateToken, analyzeSymptoms);

// Get user's symptom check history - requires user authentication
router.get('/symptom-history', authenticateToken, getSymptomHistory);

export default router;