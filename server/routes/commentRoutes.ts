import express from 'express';
import { addComment, getTaskComments } from '../controllers/commentController';
import { verifyToken } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', verifyToken, addComment);
router.get('/:taskId', verifyToken, getTaskComments);

export default router;
