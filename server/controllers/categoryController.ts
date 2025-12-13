import { Request, Response } from 'express';
import mongoose from 'mongoose'; // Cần import để dùng ObjectId
import Category from '../models/Category';
import Task from '../models/Task'; // Import Task để query

// 1. Lấy danh sách category + TỰ ĐỘNG ĐẾM TASK
export const getCategories = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    // Sử dụng Aggregate để join với bảng Task và đếm số lượng
    const categories = await Category.aggregate([
      {
        $match: { createdBy: new mongoose.Types.ObjectId(userId) }, // Lọc category của user
      },
      {
        $lookup: {
          from: 'tasks', // Tên collection trong DB (thường là 'tasks' - số nhiều, viết thường)
          localField: '_id',
          foreignField: 'category',
          as: 'tasks',
        },
      },
      {
        $addFields: {
          taskCount: { $size: '$tasks' }, // Đếm số phần tử trong mảng tasks vừa join
        },
      },
      {
        $project: {
          tasks: 0, // Bỏ mảng tasks đi cho nhẹ response, chỉ lấy số lượng
        },
      },
    ]);

    res.json({ success: true, categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi lấy danh mục' });
  }
};

// 2. [MỚI] Lấy Chi tiết Category + Danh sách Task bên trong
export const getCategoryDetail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Tìm category
    const category = await Category.findById(id);
    if (!category) {
      res
        .status(404)
        .json({ success: false, message: 'Không tìm thấy danh mục' });
      return;
    }

    // Tìm tất cả tasks thuộc category này
    const tasks = await Task.find({ category: id }).sort({ createdAt: -1 });

    res.json({ success: true, category, tasks });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Lỗi lấy chi tiết danh mục' });
  }
};

// ... Các hàm createCategory, updateCategory, deleteCategory giữ nguyên như cũ ...
// (Bạn nhớ copy lại các hàm create/update/delete cũ vào đây nhé)
export const createCategory = async (req: Request, res: Response) => {
  // ... code cũ ...
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
    // Trả về taskCount = 0 mặc định cho cái mới tạo
    res.status(201).json({
      success: true,
      category: { ...newCategory.toObject(), taskCount: 0 },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tạo danh mục' });
  }
};

export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  // ... code cũ ...
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

    // 1. [MỚI] Xóa toàn bộ Task thuộc Category này trước
    await Task.deleteMany({ category: id });

    // 2. Sau đó mới xóa Category
    await Category.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Đã xóa danh mục và các task liên quan',
    });
  } catch (error) {
    console.error('Lỗi xóa danh mục:', error); // Nên log lỗi ra để debug
    res.status(500).json({ success: false, message: 'Lỗi xóa danh mục' });
  }
};
