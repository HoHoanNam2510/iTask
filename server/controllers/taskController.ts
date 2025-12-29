/* server/controllers/taskController.ts */
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import Task from '../models/Task';
import User from '../models/User';
import Group from '../models/Group';

// [HELPER] Hàm lấy đường dẫn file chuẩn xác
const getLocalImagePath = (dbPath: string) => {
  return path.join(process.cwd(), '../', dbPath);
};

// ----------------------------------------------------------------
// [GET] /api/tasks/:id (LẤY CHI TIẾT 1 TASK)
// ----------------------------------------------------------------
export const getTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;

    // 👇 [SỬA LỖI] Dùng $ne: true để lấy cả task cũ chưa có trường isDeleted
    const task = await Task.findOne({ _id: id, isDeleted: { $ne: true } });

    if (!task) {
      res
        .status(404)
        .json({ success: false, message: 'Task not found or deleted' });
      return;
    }

    // CHECK QUYỀN TRUY CẬP
    let hasAccess = false;
    if (
      task.creator?.toString() === userId.toString() ||
      task.assignee?.toString() === userId.toString()
    ) {
      hasAccess = true;
    } else if (task.group) {
      const group = await Group.findById(task.group);
      if (group && group.members.includes(userId)) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      res.status(403).json({ success: false, message: 'No permission' });
      return;
    }

    await task.populate('category', 'name color');
    await task.populate('group', 'name members');
    await task.populate('assignee', 'username avatar email');
    await task.populate('creator', 'username avatar');

    res.json({ success: true, task });
  } catch (error) {
    console.error('Get Task Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ----------------------------------------------------------------
// [GET] /api/tasks (LẤY DANH SÁCH TASK)
// ----------------------------------------------------------------
export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    const userGroups = await Group.find({ members: userId }).distinct('_id');

    const tasks = await Task.find({
      $or: [
        { creator: userId },
        { assignee: userId },
        { group: { $in: userGroups } },
      ],
      // 👇 [SỬA LỖI QUAN TRỌNG] Để hiện task cũ
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .populate('category', 'name color')
      .populate('group', 'name')
      .populate('assignee', 'username avatar');

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks: tasks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching tasks' });
  }
};

// ----------------------------------------------------------------
// [POST] /api/tasks (TẠO MỚI)
// ----------------------------------------------------------------
export const createTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const creatorId = (req as any).user?._id;
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
        .json({ success: false, message: 'Title and Date required' });
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
      isDeleted: false, // Mặc định
    });

    await newTask.save();
    res.status(201).json({
      success: true,
      message: 'Task created',
      task: newTask,
    });
  } catch (error: any) {
    console.error('Create Task Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
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

    if (req.file) {
      updateData.image = `uploads/${req.file.filename}`;
    }
    if (updateData.priority)
      updateData.priority = updateData.priority.toLowerCase();
    if (updateData.date) updateData.dueDate = new Date(updateData.date);

    // 👇 [SỬA LỖI] Để sửa được task cũ
    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      updateData,
      { new: true }
    );

    if (!updatedTask) {
      res
        .status(404)
        .json({ success: false, message: 'Task not found or deleted' });
      return;
    }

    res.json({ success: true, message: 'Task updated', task: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};

// ----------------------------------------------------------------
// [DELETE] /api/tasks/:id (SOFT DELETE - Đưa vào thùng rác)
// ----------------------------------------------------------------
export const deleteTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // 👇 [SỬA LỖI] Để xóa được task cũ
    const task = await Task.findOne({ _id: id, isDeleted: { $ne: true } });

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    // Đánh dấu đã xóa và lưu thời gian
    task.isDeleted = true;
    task.deletedAt = new Date(); // Dùng trường này để tính 30 ngày Cronjob
    await task.save();

    res.json({ success: true, message: 'Moved task to trash' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
};

// ----------------------------------------------------------------
// [GET] /api/tasks/trash/all (LẤY DANH SÁCH THÙNG RÁC)
// ----------------------------------------------------------------
export const getTrashTasks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user._id;

    // Lấy các task do user tạo mà đã bị xóa mềm
    const tasks = await Task.find({
      creator: userId,
      isDeleted: true,
    })
      .sort({ deletedAt: -1 }) // Mới xóa lên đầu
      .populate('group', 'name');

    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching trash' });
  }
};

// ----------------------------------------------------------------
// [PUT] /api/tasks/:id/restore (KHÔI PHỤC TASK)
// ----------------------------------------------------------------
export const restoreTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Tìm trong thùng rác
    const task = await Task.findOne({ _id: id, isDeleted: true });

    if (!task) {
      res
        .status(404)
        .json({ success: false, message: 'Task not found in trash' });
      return;
    }

    // Khôi phục
    task.isDeleted = false;
    task.deletedAt = null;
    await task.save();

    res.json({ success: true, message: 'Task restored successfully', task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Restore failed' });
  }
};

// ----------------------------------------------------------------
// [DELETE] /api/tasks/:id/force (XÓA VĨNH VIỄN)
// ----------------------------------------------------------------
export const forceDeleteTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    // Xóa file ảnh (nếu có và không phải link online)
    if (task.image && !task.image.startsWith('http')) {
      const imagePath = getLocalImagePath(task.image);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (e) {}
      }
    }

    // Xóa vĩnh viễn khỏi DB
    await Task.findByIdAndDelete(id);
    res.json({ success: true, message: 'Task permanently deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Force delete failed' });
  }
};

// ----------------------------------------------------------------
// [GET] Search Task (Gợi ý cho Header)
// ----------------------------------------------------------------
export const searchTasks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      res.json({ success: true, tasks: [] });
      return;
    }

    const userId = (req as any).user._id;
    const userGroups = await Group.find({ members: userId }).distinct('_id');

    const tasks = await Task.find({
      title: { $regex: q, $options: 'i' },
      isDeleted: { $ne: true }, // 👈 [SỬA LỖI]
      $or: [
        { creator: userId },
        { assignee: userId },
        { group: { $in: userGroups } },
      ],
    })
      .select('title status group _id')
      .populate('group', 'name')
      .limit(5);

    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Search error' });
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
    // Admin có thể xem tất cả (kể cả đã xóa nếu muốn, ở đây để xem hết)
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
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
