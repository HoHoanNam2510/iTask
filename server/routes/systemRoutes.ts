/* server/routes/systemRoutes.ts */
import express from 'express';
import {
  getZegoToken,
  getSystemConfig,
  updateSystemConfig,
} from '../controllers/systemController';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Ai cũng lấy được config (để hiển thị banner)
router.get('/', getSystemConfig);

// Route lấy token (User nào cũng lấy được để họp)
router.get('/zego-token', verifyToken, getZegoToken);

// Chỉ Admin mới được sửa
router.put('/', verifyToken, verifyAdmin, updateSystemConfig);

export default router;
