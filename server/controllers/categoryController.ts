import { Request, Response } from 'express';
import Category from '../models/Category';

// Lấy danh sách category của user
export const getCategories = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const categories = await Category.find({ createdBy: userId });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy danh mục' });
  }
};

// Tạo category mới
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, color } = req.body;
    const userId = (req as any).user._id;

    const newCategory = new Category({
      name,
      description,
      color,
      createdBy: userId,
    });

    await newCategory.save();
    res.status(201).json({ success: true, category: newCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tạo danh mục' });
  }
};

// Sửa category
export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedCategory = await Category.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updatedCategory) {
      res
        .status(404)
        .json({ success: false, message: 'Không tìm thấy danh mục' });
      return;
    }
    res.json({ success: true, category: updatedCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật' });
  }
};

// Xóa category
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Category.findByIdAndDelete(id);
    res.json({ success: true, message: 'Đã xóa danh mục' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xóa' });
  }
};
