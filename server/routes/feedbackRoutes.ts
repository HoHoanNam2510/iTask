/* server/routes/feedbackRoutes.ts */
import express from 'express';
import {
  createFeedback,
  getAllFeedbacks,
  updateFeedback,
  deleteFeedback,
} from '../controllers/feedbackController';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// User Routes
router.post('/', verifyToken, createFeedback);

// Admin Routes
router.get('/admin/all', verifyToken, verifyAdmin, getAllFeedbacks);
router.put('/admin/:id', verifyToken, verifyAdmin, updateFeedback);
router.delete('/admin/:id', verifyToken, verifyAdmin, deleteFeedback);

export default router;
