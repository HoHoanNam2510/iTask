import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Task from '../models/Task';
import User from '../models/User';
import Group from '../models/Group';

// [HELPER] Hàm lấy đường dẫn file chuẩn xác
const getLocalImagePath = (dbPath: string) => {
  return path.join(process.cwd(), '../', dbPath);
};

// ----------------------------------------------------------------
// [GET] /api/tasks/:id (LẤY CHI TIẾT 1 TASK) -> Fix lỗi 404 khi click thông báo
// ----------------------------------------------------------------
export const getTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;

    // 1. Tìm Task
    const task = await Task.findById(id);

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    // 2. CHECK QUYỀN TRUY CẬP
    let hasAccess = false;

    // - Nếu là người tạo (creator) hoặc người được giao (assignee) -> Có quyền
    if (
      task.creator?.toString() === userId.toString() ||
      task.assignee?.toString() === userId.toString()
    ) {
      hasAccess = true;
    }
    // - Nếu task thuộc nhóm -> Check xem user có trong nhóm đó không
    else if (task.group) {
      const group = await Group.findById(task.group);
      if (group && group.members.includes(userId)) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      res
        .status(403)
        .json({ success: false, message: 'Bạn không có quyền xem task này' });
      return;
    }

    // 3. Populate dữ liệu cần thiết để hiển thị trên Modal
    await task.populate('category', 'name color');
    await task.populate('group', 'name members');
    await task.populate('assignee', 'username avatar email');
    await task.populate('creator', 'username avatar');

    res.json({ success: true, task });
  } catch (error) {
    console.error('Get Single Task Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ----------------------------------------------------------------
// [GET] /api/tasks (LẤY DANH SÁCH TASK) -> Đã update logic Group
// ----------------------------------------------------------------
export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;

    // 1. Tìm tất cả các nhóm mà user là thành viên
    const userGroups = await Group.find({ members: userId }).distinct('_id');

    // 2. Tìm task thỏa mãn 1 trong 3 điều kiện:
    // - User là người tạo
    // - User là người được giao
    // - Task thuộc về nhóm mà user tham gia
    const tasks = await Task.find({
      $or: [
        { creator: userId },
        { assignee: userId },
        { group: { $in: userGroups } }, // 👈 Logic mới bổ sung
      ],
    })
      .sort({ createdAt: -1 })
      .populate('category', 'name color')
      .populate('group', 'name')
      .populate('assignee', 'username avatar'); // Hiện avatar người làm

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

// ----------------------------------------------------------------
// [POST] /api/tasks
// ----------------------------------------------------------------
export const createTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log('👉 Đã nhận được request tạo Task!', req.body);

  try {
    const creatorId = (req as any).user?._id;
    if (!creatorId) {
      res
        .status(401)
        .json({ success: false, message: 'Unauthorized: User not found' });
      return;
    }

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

    let imageUrl = '';
    if (req.file) {
      imageUrl = `uploads/${req.file.filename}`;
    }

    const group = groupId ? groupId : null;
    const assignee = req.body.assignee ? req.body.assignee : creatorId;
    const finalPriority = priority ? priority.toLowerCase() : 'moderate';

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

// Helper function: Kiểm tra và trao huy hiệu
const checkAndAwardBadges = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // Đếm số task đã xong trong 7 ngày qua
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const completedRecent = await Task.countDocuments({
      assignee: userId,
      status: 'completed',
      updatedAt: { $gte: sevenDaysAgo },
    });

    let isUpdated = false;

    // 1. Badge: Ong Chăm Chỉ (Hoàn thành 5 task/tuần)
    if (completedRecent >= 5) {
      const badgeCode = 'HARD_BEE';
      // Check xem đã có chưa
      const hasBadge = user.badges.some((b) => b.code === badgeCode);
      if (!hasBadge) {
        user.badges.push({
          code: badgeCode,
          name: 'Ong Chăm Chỉ',
          icon: '🐝',
          awardedAt: new Date(),
        });
        isUpdated = true;
        console.log(`🏆 Trao badge ${badgeCode} cho user ${user.username}`);
      }
    }

    // 2. Badge: Chiến Thần (Hoàn thành 10 task/tuần)
    if (completedRecent >= 10) {
      const badgeCode = 'WARRIOR';
      const hasBadge = user.badges.some((b) => b.code === badgeCode);
      if (!hasBadge) {
        user.badges.push({
          code: badgeCode,
          name: 'Chiến Thần Task',
          icon: '⚔️',
          awardedAt: new Date(),
        });
        isUpdated = true;
      }
    }

    if (isUpdated) {
      await user.save();
    }
  } catch (error) {
    console.error('Lỗi check badge:', error);
  }
};

// ----------------------------------------------------------------
// [PUT] /api/tasks/:id (CẬP NHẬT)
// ----------------------------------------------------------------
export const updateTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: any = { ...req.body };

    // ... (Giữ nguyên logic xử lý ảnh và date cũ) ...
    if (req.file) {
      /* ...Code cũ... */
    }
    if (updateData.priority)
      updateData.priority = updateData.priority.toLowerCase();
    if (updateData.date) updateData.dueDate = new Date(updateData.date);

    const updatedTask = await Task.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedTask) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    // 👇 [MỚI] CHECK BADGE SAU KHI UPDATE THÀNH CÔNG
    // Nếu status được gửi lên là 'completed'
    if (req.body.status === 'completed' && updatedTask.assignee) {
      // Chạy ngầm (không cần await để trả response nhanh)
      checkAndAwardBadges(updatedTask.assignee.toString());
    }

    res.json({ success: true, message: 'Task updated', task: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};

// ----------------------------------------------------------------
// [DELETE] /api/tasks/:id
// ----------------------------------------------------------------
export const deleteTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const taskToDelete = await Task.findById(id);

    if (!taskToDelete) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    if (taskToDelete.image && !taskToDelete.image.startsWith('http')) {
      const imagePath = getLocalImagePath(taskToDelete.image);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
          console.log('🗑️ Đã dọn dẹp ảnh của task bị xóa:', imagePath);
        } catch (err) {
          console.error('Lỗi dọn dẹp ảnh:', err);
        }
      }
    }

    await Task.findByIdAndDelete(id);
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
};

// ----------------------------------------------------------------
// [ADMIN] Get All Tasks
// ----------------------------------------------------------------
export const getAllTasksAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tasks = await Task.find()
      .populate('creator', 'username email avatar')
      .populate('category', 'name color')
      .populate('group', 'name')
      .sort({ createdAt: -1 });

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
