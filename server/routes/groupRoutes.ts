import express from 'express';
import {
  createGroup,
  getGroupDetails,
  addMember,
} from '../controllers/groupController';
import { verifyToken } from '../middleware/authMiddleware';

const router = express.Router();

router.use(verifyToken); // Bắt buộc đăng nhập

router.post('/', createGroup);
router.get('/:groupId', getGroupDetails);
router.post('/:groupId/invite', addMember);

export default router;
