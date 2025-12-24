import express from 'express';
import {
  addComment,
  getTaskComments,
  updateComment,
  deleteComment,
} from '../controllers/commentController';
import { verifyToken } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', verifyToken, addComment);
router.get('/:taskId', verifyToken, getTaskComments);
router.put('/:id', verifyToken, updateComment);
router.delete('/:id', verifyToken, deleteComment);

export default router;
