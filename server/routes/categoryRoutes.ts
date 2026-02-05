/* server/routes/categoryRoutes.ts */
import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryDetail,
  // Admin Imports
  getAllCategoriesAdmin,
  updateCategoryAdmin,
  deleteCategoryAdmin,
} from '../controllers/categoryController';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware';

const router = express.Router();
router.use(verifyToken);

// ==========================
// 🟢 ROUTES CHO USER
// ==========================
router.get('/', getCategories);
router.post('/', createCategory);
router.get('/:id', getCategoryDetail);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

// ==========================
// 🔴 ROUTES CHO ADMIN
// ==========================
// Lấy danh sách admin
router.get('/admin/all', verifyToken, verifyAdmin, getAllCategoriesAdmin);

// 👇 [FIXED] Thêm route PUT cho Admin để sửa category bất kỳ
router.put('/admin/:id', verifyToken, verifyAdmin, updateCategoryAdmin);

// Xóa cho admin
router.delete('/admin/:id', verifyToken, verifyAdmin, deleteCategoryAdmin);

export default router;
