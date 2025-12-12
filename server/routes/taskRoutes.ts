import express from 'express';
// 1. QUAN TRỌNG: Phải import thêm getTasks ở đây
import { createTask, getTasks } from '../controllers/taskController';
import upload from '../middleware/upload';
import { verifyToken } from '../middleware/authMiddleware';

const router = express.Router();

// 2. QUAN TRỌNG: Thêm dòng này để xử lý GET (Lấy danh sách)
// Nếu thiếu dòng này -> Lỗi 404 Not Found
router.get('/', verifyToken, getTasks);

// Route xử lý POST (Tạo mới) - Code cũ của bạn
router.post('/', verifyToken, upload.single('image'), createTask);

export default router;
