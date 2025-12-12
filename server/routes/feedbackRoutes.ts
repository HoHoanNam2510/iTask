import express from 'express';
import { createFeedback } from '../controllers/feedbackController';
import { verifyToken } from '../middleware/authMiddleware';

const router = express.Router();
router.post('/', verifyToken, createFeedback);

export default router;
