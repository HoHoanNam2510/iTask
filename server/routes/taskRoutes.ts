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
  startTimer, // 👈 [MỚI]
  stopTimer, // 👈 [MỚI]
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

// Config Upload Fields
const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'attachments', maxCount: 10 },
]);

router.post('/', verifyToken, uploadFields, createTask);
router.put('/:id', verifyToken, uploadFields, updateTask);
router.delete('/:id', verifyToken, deleteTask);

// 👇 [MỚI] Time Tracking Routes
router.post('/:id/timer/start', verifyToken, startTimer);
router.post('/:id/timer/stop', verifyToken, stopTimer);

// Trash Actions
router.put('/:id/restore', verifyToken, restoreTask);
router.delete('/:id/force', verifyToken, forceDeleteTask);

// Admin
router.get('/admin/all', verifyToken, verifyAdmin, getAllTasksAdmin);

export default router;
