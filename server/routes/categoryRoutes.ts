import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryDetail,
  getAllCategoriesAdmin,
  deleteCategoryAdmin,
} from '../controllers/categoryController';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware';

const router = express.Router();
router.use(verifyToken);

// Routes cho User
router.get('/', getCategories);
router.get('/:id', getCategoryDetail);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

// Routes cho Admin
router.get('/admin/all', verifyToken, verifyAdmin, getAllCategoriesAdmin);
router.delete('/admin/:id', verifyToken, verifyAdmin, deleteCategoryAdmin);
export default router;
