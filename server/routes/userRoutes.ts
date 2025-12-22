import express from 'express';
import {
  updateUserProfile,
  getAllUsers,
  deleteUser,
} from '../controllers/userController';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware';
import upload from '../middleware/upload'; // Dùng chung middleware upload với Task

const router = express.Router();

// Routes dành cho User
// PUT /api/users/profile: Check Token -> Xử lý file upload -> Vào Controller
router.put('/profile', verifyToken, upload.single('avatar'), updateUserProfile);

// Routes dành cho Admin
// GET /api/users -> Lấy danh sách
router.get('/', verifyToken, verifyAdmin, getAllUsers);
// DELETE /api/users/:id -> Xóa user
router.delete('/:id', verifyToken, verifyAdmin, deleteUser);
export default router;
