import express from 'express';
import { getDashboardSummary } from '../controllers/dashboardController';
import { verifyToken } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/summary', verifyToken, getDashboardSummary);

export default router;
