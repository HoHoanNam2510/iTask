import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryDetail,
} from '../controllers/categoryController';
import { verifyToken } from '../middleware/authMiddleware';

const router = express.Router();
router.use(verifyToken);

router.get('/', getCategories);
router.get('/:id', getCategoryDetail);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
