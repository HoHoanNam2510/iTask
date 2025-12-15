import express from 'express';
// 1. QUAN TRỌNG: Phải import thêm getTasks ở đây
import {
  getTasks,
  createTask,
  deleteTask,
  updateTask,
} from '../controllers/taskController';
import upload from '../middleware/upload';
import { verifyToken } from '../middleware/authMiddleware';

const router = express.Router();

// 2. QUAN TRỌNG: Thêm dòng này để xử lý GET (Lấy danh sách)
// Nếu thiếu dòng này -> Lỗi 404 Not Found
router.get('/', verifyToken, getTasks);

// Route xử lý POST (Tạo mới)
router.post('/', verifyToken, upload.single('image'), createTask);

router.put('/:id', verifyToken, upload.single('image'), updateTask);
router.delete('/:id', verifyToken, deleteTask);
export default router;
