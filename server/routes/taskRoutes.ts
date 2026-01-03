/* server/routes/taskRoutes.ts */
import express from 'express';
import {
  getTask,
  getTasks,
  createTask,
  deleteTask,
  updateTask,
  searchTasks,
  getAllTasksAdmin,
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
router.get('/trash/all', verifyToken, getTrashTasks);

// Basic CRUD
router.get('/:id', verifyToken, getTask);

// 👇 [CẬP NHẬT] Thay upload.single('image') bằng upload.fields để nhận cả Attachments
const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 }, // 1 Ảnh bìa
  { name: 'attachments', maxCount: 10 }, // Tối đa 10 file đính kèm
]);

router.post('/', verifyToken, uploadFields, createTask);
router.put('/:id', verifyToken, uploadFields, updateTask);
router.delete('/:id', verifyToken, deleteTask);

// Trash Actions
router.put('/:id/restore', verifyToken, restoreTask);
router.delete('/:id/force', verifyToken, forceDeleteTask);

// Admin
router.get('/admin/all', verifyToken, verifyAdmin, getAllTasksAdmin);

export default router;
