/* server/routes/adminRoutes.ts */
import express from 'express';
import { getSystemLogs, getAdminStats } from '../controllers/adminController';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Middleware verifyAdmin đảm bảo chỉ Admin mới gọi được các API này
router.get('/logs', verifyToken, verifyAdmin, getSystemLogs);
router.get('/stats', verifyToken, verifyAdmin, getAdminStats);

export default router;
