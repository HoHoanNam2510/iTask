/* server/routes/taskRoutes.ts */
import express from 'express';
import {
  getTask,
  getTasks,
  createTask,
  deleteTask, // Soft delete
  updateTask,
  searchTasks,
  getAllTasksAdmin,
  // 👇 [MỚI] Import các hàm xử lý thùng rác
  getTrashTasks,
  restoreTask,
  forceDeleteTask,
} from '../controllers/taskController';
import upload from '../middleware/upload';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Routes cho User
router.get('/', verifyToken, getTasks);
router.get('/search', verifyToken, searchTasks);

// 👇 [MỚI] Route lấy thùng rác (Đặt TRƯỚC route /:id)
router.get('/trash/all', verifyToken, getTrashTasks);

// Các route thao tác trên ID
router.get('/:id', verifyToken, getTask);
router.post('/', verifyToken, upload.single('image'), createTask);
router.put('/:id', verifyToken, upload.single('image'), updateTask);
router.delete('/:id', verifyToken, deleteTask); // Soft delete

// 👇 [MỚI] Restore & Force Delete (Xóa vĩnh viễn)
router.put('/:id/restore', verifyToken, restoreTask);
router.delete('/:id/force', verifyToken, forceDeleteTask);

// Routes cho Admin
router.get('/admin/all', verifyToken, verifyAdmin, getAllTasksAdmin);

export default router;
