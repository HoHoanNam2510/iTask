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
  startTimer,
  stopTimer,
} from '../controllers/taskController';
import upload from '../middleware/upload';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// --- 🛑 QUAN TRỌNG: CÁC ROUTE ĐẶC BIỆT PHẢI ĐẶT TRƯỚC /:id ---

// Routes cho User
router.get('/', verifyToken, getTasks);
router.get('/search', verifyToken, searchTasks);

// 👇 [FIXED] Đổi thành /trash và đặt trước /:id
router.get('/trash', verifyToken, getTrashTasks);

// Admin
router.get('/admin/all', verifyToken, verifyAdmin, getAllTasksAdmin);

// --- Basic CRUD (Các route có tham số :id đặt sau cùng) ---
router.get('/:id', verifyToken, getTask);

// Config Upload Fields
const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'attachments', maxCount: 10 },
]);

router.post('/', verifyToken, uploadFields, createTask);
router.put('/:id', verifyToken, uploadFields, updateTask);
router.delete('/:id', verifyToken, deleteTask);

// Time Tracking Routes
router.post('/:id/timer/start', verifyToken, startTimer);
router.post('/:id/timer/stop', verifyToken, stopTimer);

// Trash Actions
router.put('/:id/restore', verifyToken, restoreTask);
router.delete('/:id/force', verifyToken, forceDeleteTask);

export default router;
