import express from 'express';
import { createTask } from '../controllers/taskController';
import upload from '../middleware/upload';
import { verifyToken } from '../middleware/authMiddleware'; // Middleware xác thực user

const router = express.Router();

// 'image' là key mà frontend dùng khi gửi FormData
router.post('/', verifyToken, upload.single('image'), createTask);

export default router;
