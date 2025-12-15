import express from 'express';
import { updateUserProfile } from '../controllers/userController';
import { verifyToken } from '../middleware/authMiddleware';
import upload from '../middleware/upload'; // Dùng chung middleware upload với Task

const router = express.Router();

// Định nghĩa route: PUT /api/users/profile
// Thứ tự: Check Token -> Xử lý file upload -> Vào Controller
router.put('/profile', verifyToken, upload.single('avatar'), updateUserProfile);

export default router;
