/* server/routes/aiRoutes.ts */
import express from 'express';
import { generateSubtasks } from '../controllers/aiController';
import { verifyToken } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/generate-subtasks', verifyToken, generateSubtasks);

export default router;
