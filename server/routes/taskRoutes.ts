import express from 'express';
// 1. QUAN TRỌNG: Phải import thêm getTasks ở đây
import {
  getTasks,
  createTask,
  deleteTask,
  updateTask,
  getAllTasksAdmin,
} from '../controllers/taskController';
import upload from '../middleware/upload';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Routes cho User
router.get('/', verifyToken, getTasks);
router.post('/', verifyToken, upload.single('image'), createTask);
router.put('/:id', verifyToken, upload.single('image'), updateTask);
router.delete('/:id', verifyToken, deleteTask);

// Routes cho Admin
router.get('/admin/all', verifyToken, verifyAdmin, getAllTasksAdmin);
export default router;
