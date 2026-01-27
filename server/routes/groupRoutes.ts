/* server/routes/groupRoutes.ts */
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
  leaveGroup, // 👇 [MỚI] Import hàm leaveGroup
} from '../controllers/groupController';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware';

const router = express.Router();

router.use(verifyToken);

// Routes cho User
router.post('/', createGroup);
router.post('/join', joinGroupByCode);
router.get('/my-groups', getMyGroups);
router.get('/:groupId', getGroupDetails);
router.put('/:groupId', updateGroup);
router.delete('/:groupId', disbandGroup);
router.post('/:groupId/invite', addMember);
router.post('/:groupId/remove-member', removeMember); // Kick member (Owner)
router.post('/:groupId/leave', leaveGroup); // 👇 [MỚI] Rời nhóm (Member)
router.get('/:groupId/leaderboard', getGroupLeaderboard);

// Routes cho Admin
router.get('/admin/all', verifyToken, verifyAdmin, getAllGroupsAdmin);
router.delete('/admin/:id', verifyToken, verifyAdmin, deleteGroupAdmin);
router.put('/admin/:id', verifyToken, verifyAdmin, updateGroupAdmin);

export default router;
