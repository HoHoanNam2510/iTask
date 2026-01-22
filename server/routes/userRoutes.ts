import express from 'express';
import {
  updateUserProfile,
  getAllUsers,
  deleteUser,
  changePassword,
  updateUserAdmin,
} from '../controllers/userController';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware';
import upload from '../middleware/upload';

const router = express.Router();

// Routes cho User
router.put('/profile', verifyToken, upload.single('avatar'), updateUserProfile);
router.put('/change-password', verifyToken, changePassword);

// Routes cho Admin
router.get('/', verifyToken, verifyAdmin, getAllUsers);
router.delete('/:id', verifyToken, verifyAdmin, deleteUser);
router.put('/:id/admin', verifyToken, verifyAdmin, updateUserAdmin);

export default router;
