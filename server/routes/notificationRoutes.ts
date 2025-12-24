import express from 'express';
import {
  getMyNotifications,
  markAsRead,
  deleteNotification,
} from '../controllers/notificationController';
import { verifyToken } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', verifyToken, getMyNotifications);
router.put('/:id/read', verifyToken, markAsRead);
router.delete('/:id', verifyToken, deleteNotification);

export default router;
