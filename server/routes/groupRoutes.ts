import express from 'express';
import {
  createGroup,
  getGroupDetails,
  addMember,
  getMyGroups,
  joinGroupByCode,
  getAllGroupsAdmin,
  deleteGroupAdmin,
} from '../controllers/groupController';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware';

const router = express.Router();

router.use(verifyToken); // Bắt buộc đăng nhập

// Routes của User
router.post('/', createGroup);
router.post('/join', joinGroupByCode);
router.get('/my-groups', getMyGroups);
router.get('/:groupId', getGroupDetails);
router.post('/:groupId/invite', addMember);

// Routes của Admin
router.get('/admin/all', verifyToken, verifyAdmin, getAllGroupsAdmin);
router.delete('/admin/:id', verifyToken, verifyAdmin, deleteGroupAdmin);
export default router;
