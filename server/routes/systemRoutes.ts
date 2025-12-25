/* server/routes/systemRoutes.ts */
import express from 'express';
import {
  getSystemConfig,
  updateSystemConfig,
} from '../controllers/systemController';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Ai cũng lấy được config (để hiển thị banner)
router.get('/', getSystemConfig);

// Chỉ Admin mới được sửa
router.put('/', verifyToken, verifyAdmin, updateSystemConfig);

export default router;
