import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task';
import fs from 'fs'; // Thư viện thao tác file
import path from 'path'; // Thư viện thao tác đường dẫn

// [HELPER] Hàm lấy đường dẫn file chuẩn xác
// Thêm '../' để lùi ra ngoài folder server
const getLocalImagePath = (dbPath: string) => {
  return path.join(process.cwd(), '../', dbPath);
};

// [GET] /api/tasks
export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;

    const tasks = await Task.find({
      $or: [{ creator: userId }, { assignee: userId }],
    })
      .sort({ createdAt: -1 })
      .populate('category', 'name color')
      .populate('group', 'name');

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks: tasks,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: 'Server Error fetching tasks' });
  }
};

// [POST] /api/tasks
export const createTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log('👉 Đã nhận được request tạo Task!', req.body);

  try {
    // 1. Kiểm tra Auth
    const creatorId = (req as any).user?._id;
    if (!creatorId) {
      res
        .status(401)
        .json({ success: false, message: 'Unauthorized: User not found' });
      return;
    }

    // 2. Lấy dữ liệu
    const {
      title,
      description,
      date,
      dueDate,
      priority,
      status,
      groupId,
      categoryId,
    } = req.body;

    const finalDate = date || dueDate;
    if (!title || !finalDate) {
      res
        .status(400)
        .json({ success: false, message: 'Title and Date are required' });
      return;
    }

    // 3. Xử lý ảnh (Lưu đường dẫn tương đối: uploads/filename)
    let imageUrl = '';
    if (req.file) {
      imageUrl = `uploads/${req.file.filename}`;
    }

    // 4. Xử lý Group/Assignee
    const group = groupId ? groupId : null;
    const assignee = req.body.assignee ? req.body.assignee : creatorId;

    // 5. Priority
    const finalPriority = priority ? priority.toLowerCase() : 'moderate';

    // 6. Tạo Task
    const newTask = new Task({
      title,
      description,
      image: imageUrl,
      dueDate: new Date(finalDate),
      priority: finalPriority,
      status: status || 'todo',
      creator: creatorId,
      assignee: assignee,
      group: group,
      category: categoryId || null,
    });

    await newTask.save();
    console.log(`✅ Đã lưu Task "${newTask.title}" với ID: ${newTask._id}`);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: newTask,
    });
  } catch (error: any) {
    console.error('Create Task Error:', error);
    if (error.name === 'ValidationError') {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// [PUT] /api/tasks/:id
export const updateTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: any = { ...req.body };

    // --- LOGIC XÓA ẢNH CŨ KHI CÓ ẢNH MỚI ---
    if (req.file) {
      // 1. Set đường dẫn ảnh mới
      updateData.image = `uploads/${req.file.filename}`;

      // 2. Tìm task cũ
      const oldTask = await Task.findById(id);

      // 3. Xóa ảnh cũ nếu có
      if (oldTask && oldTask.image && !oldTask.image.startsWith('http')) {
        // [QUAN TRỌNG] Sử dụng hàm helper đã sửa đường dẫn
        const oldAbsolutePath = getLocalImagePath(oldTask.image);

        if (fs.existsSync(oldAbsolutePath)) {
          try {
            fs.unlinkSync(oldAbsolutePath);
            console.log('🗑️ Đã xóa file ảnh cũ:', oldAbsolutePath);
          } catch (err) {
            console.error('Lỗi khi xóa ảnh cũ:', err);
          }
        }
      }
    }
    // ----------------------------------------

    if (updateData.priority) {
      updateData.priority = updateData.priority.toLowerCase();
    }
    if (updateData.date) {
      updateData.dueDate = new Date(updateData.date);
    }

    const updatedTask = await Task.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedTask) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    res.json({ success: true, message: 'Task updated', task: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};

// [DELETE] /api/tasks/:id
export const deleteTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // --- LOGIC XÓA ẢNH KHI XÓA TASK ---
    const taskToDelete = await Task.findById(id);

    if (!taskToDelete) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    // Nếu có ảnh, xóa file trên ổ cứng
    if (taskToDelete.image && !taskToDelete.image.startsWith('http')) {
      // [QUAN TRỌNG] Sử dụng hàm helper đã sửa đường dẫn
      const imagePath = getLocalImagePath(taskToDelete.image);

      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
          console.log('🗑️ Đã dọn dẹp ảnh của task bị xóa:', imagePath);
        } catch (err) {
          console.error('Lỗi dọn dẹp ảnh:', err);
        }
      } else {
        console.log('⚠️ File ảnh không tồn tại để xóa:', imagePath);
      }
    }
    // -----------------------------------

    await Task.findByIdAndDelete(id);

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
};

// ADMIN
// 👇 [THÊM MỚI] Admin lấy toàn bộ Task trong hệ thống
export const getAllTasksAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Lấy tất cả task, populate thông tin người tạo (creator) để biết task của ai
    const tasks = await Task.find()
      .populate('creator', 'username email avatar') // Lấy tên, email, avatar người tạo
      .sort({ createdAt: -1 }); // Mới nhất lên đầu

    res.json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error('Admin Get Tasks Error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Lỗi server khi lấy danh sách tasks' });
  }
};
