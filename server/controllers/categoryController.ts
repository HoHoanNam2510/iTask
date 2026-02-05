/* server/controllers/categoryController.ts */
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Category from '../models/Category';
import Task from '../models/Task';

// ==========================================
// 🟢 USER CONTROLLERS (Logic cho người dùng thường)
// ==========================================

// 1. Lấy danh sách category của User (kèm số lượng task)
export const getCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user._id;

    const categories = await Category.aggregate([
      {
        $match: { createdBy: new mongoose.Types.ObjectId(userId) },
      },
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: 'category',
          as: 'tasks',
        },
      },
      {
        $addFields: {
          taskCount: { $size: '$tasks' },
        },
      },
      {
        $project: {
          tasks: 0,
        },
      },
    ]);

    res.json({ success: true, categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi lấy danh mục' });
  }
};

// 2. Lấy chi tiết 1 category (User)
export const getCategoryDetail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;

    const category = await Category.findOne({ _id: id, createdBy: userId });
    if (!category) {
      res
        .status(404)
        .json({ success: false, message: 'Không tìm thấy danh mục' });
      return;
    }
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// 3. Tạo mới category (User)
export const createCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, description, color } = req.body;
    const userId = (req as any).user._id;

    // Check trùng tên của chính user đó
    const existing = await Category.findOne({ name, createdBy: userId });
    if (existing) {
      res.status(400).json({ success: false, message: 'Danh mục đã tồn tại' });
      return;
    }

    const newCategory = new Category({
      name,
      description,
      color: color || '#40a578',
      createdBy: userId,
    });

    await newCategory.save();
    res.status(201).json({ success: true, category: newCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tạo danh mục' });
  }
};

// 4. Cập nhật category (User - Phải check createdBy)
export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;
    const { name, description, color } = req.body;

    const category = await Category.findOneAndUpdate(
      { _id: id, createdBy: userId }, // Điều kiện an toàn
      { name, description, color },
      { new: true }
    );

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy hoặc không có quyền',
      });
      return;
    }

    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật' });
  }
};

// 5. Xóa category (User - Phải check createdBy)
export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;

    const deleted = await Category.findOneAndDelete({
      _id: id,
      createdBy: userId,
    });
    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy hoặc không có quyền',
      });
      return;
    }

    // Set null category cho các task liên quan
    await Task.updateMany({ category: id }, { $set: { category: null } });

    res.json({ success: true, message: 'Đã xóa danh mục' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xóa danh mục' });
  }
};

// ==========================================
// 🔴 ADMIN CONTROLLERS (Logic quyền Admin)
// ==========================================

// 6. Admin: Lấy tất cả (Phân trang, Search)
export const getAllCategoriesAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const order = (req.query.order as string) || 'desc';

    const skip = (page - 1) * limit;
    const query: any = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const sortOption: any = { [sortBy]: order === 'asc' ? 1 : -1 };

    const categories = await Category.find(query)
      .populate('createdBy', 'username email avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const totalCategories = await Category.countDocuments(query);

    res.json({
      success: true,
      total: totalCategories,
      totalPages: Math.ceil(totalCategories / limit),
      categories,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// 7. Admin: Cập nhật category (Không cần check createdBy)
export const updateCategoryAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    // Admin có thể sửa bất kỳ category nào theo ID
    const category = await Category.findByIdAndUpdate(
      id,
      { name, description, color },
      { new: true }
    );

    if (!category) {
      res
        .status(404)
        .json({ success: false, message: 'Danh mục không tồn tại' });
      return;
    }

    res.json({ success: true, message: 'Cập nhật thành công', category });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Lỗi server khi cập nhật' });
  }
};

// 8. Admin: Xóa category (Không cần check createdBy)
export const deleteCategoryAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      res
        .status(404)
        .json({ success: false, message: 'Không tìm thấy danh mục' });
      return;
    }

    await Task.updateMany({ category: id }, { $set: { category: null } });

    res.json({ success: true, message: 'Admin đã xóa danh mục thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa' });
  }
};
