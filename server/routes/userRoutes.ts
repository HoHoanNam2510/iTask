/* server/routes/userRoutes.ts */
import express from 'express';
import {
  updateUserProfile,
  getAllUsers,
  deleteUser,
  changePassword,
  updateUserAdmin,
  getAllUsersAdmin,
  forgotPassword,
  resetPassword,
} from '../controllers/userController';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware';
import upload from '../middleware/upload';

const router = express.Router();

// Public Routes (Quên mật khẩu)
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// Protected User Routes
router.put('/profile', verifyToken, upload.single('avatar'), updateUserProfile);
router.put('/change-password', verifyToken, changePassword);

// Protected Admin Routes
router.get('/', verifyToken, verifyAdmin, getAllUsers);
router.get('/admin/all', verifyToken, verifyAdmin, getAllUsersAdmin);
router.delete('/:id', verifyToken, verifyAdmin, deleteUser);
router.put('/:id/admin', verifyToken, verifyAdmin, updateUserAdmin);

export default router;
