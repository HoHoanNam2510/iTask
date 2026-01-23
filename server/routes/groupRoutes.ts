import express from 'express';
import {
  createGroup,
  getGroupDetails,
  addMember,
  getMyGroups,
  joinGroupByCode,
  getAllGroupsAdmin,
  deleteGroupAdmin,
  updateGroupAdmin,
  getGroupLeaderboard,
  updateGroup,
  disbandGroup,
  removeMember,
} from '../controllers/groupController';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware';

const router = express.Router();

router.use(verifyToken); // Bắt buộc đăng nhập

// Routes cho User
router.post('/', createGroup);
router.post('/join', joinGroupByCode);
router.get('/my-groups', getMyGroups);
router.get('/:groupId', getGroupDetails);
router.put('/:groupId', updateGroup); // Update thông tin nhóm
router.delete('/:groupId', disbandGroup); // Giải tán nhóm
router.post('/:groupId/invite', addMember);
router.post('/:groupId/remove-member', removeMember); // Kick member
router.get('/:groupId/leaderboard', getGroupLeaderboard);

// Routes cho Admin
router.get('/admin/all', verifyToken, verifyAdmin, getAllGroupsAdmin);
router.delete('/admin/:id', verifyToken, verifyAdmin, deleteGroupAdmin);
router.put('/admin/:id', verifyToken, verifyAdmin, updateGroupAdmin);

export default router;
