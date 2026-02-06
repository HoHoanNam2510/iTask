/* server/routes/userRoutes.ts */
import express from 'express';
import {
  updateUserProfile,
  getAllUsers,
  deleteUser,
  changePassword,
  updateUserAdmin,
  getAllUsersAdmin,
  forgotPassword, // 👇 Import function
  resetPassword, // 👇 Import function
} from '../controllers/userController';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware';
import upload from '../middleware/upload';

const router = express.Router();

// --- PUBLIC ROUTES (Không cần đăng nhập) ---
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// --- PROTECTED ROUTES (Cần đăng nhập) ---
router.put('/profile', verifyToken, upload.single('avatar'), updateUserProfile);
router.put('/change-password', verifyToken, changePassword);

// --- ADMIN ROUTES ---
router.get('/', verifyToken, verifyAdmin, getAllUsers);
router.get('/admin/all', verifyToken, verifyAdmin, getAllUsersAdmin);
router.delete('/:id', verifyToken, verifyAdmin, deleteUser);
router.put('/:id/admin', verifyToken, verifyAdmin, updateUserAdmin);

export default router;
