import express from 'express';
import {
  updateUserProfile,
  getAllUsers,
  deleteUser,
  changePassword,
} from '../controllers/userController';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware';
import upload from '../middleware/upload'; // Dùng chung middleware upload với Task

const router = express.Router();

// Routes cho User và Admin
// PUT /api/users/profile: Check Token -> Xử lý file upload -> Vào Controller
router.put('/profile', verifyToken, upload.single('avatar'), updateUserProfile);

// Routes cho Admin
// GET /api/users -> Lấy danh sách
router.get('/', verifyToken, verifyAdmin, getAllUsers);
// DELETE /api/users/:id -> Xóa user
router.delete('/:id', verifyToken, verifyAdmin, deleteUser);

// Change password
router.put('/change-password', verifyToken, changePassword);
export default router;
