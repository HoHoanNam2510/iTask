/* server/controllers/taskController.ts */
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import Task from '../models/Task';
import Group from '../models/Group';

// Helper: Lấy đường dẫn file vật lý và Xóa an toàn
const getLocalPath = (dbPath: string) => {
  return path.join(process.cwd(), '../', dbPath);
};

const safeDeleteFile = (dbPath: string | undefined) => {
  if (!dbPath || dbPath.startsWith('http')) return;
  try {
    const absolutePath = getLocalPath(dbPath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (error) {
    console.error(`❌ Error deleting file ${dbPath}:`, error);
  }
};

// --- GET TASK ---
export const getTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;

    const task = await Task.findOne({ _id: id, isDeleted: { $ne: true } });

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    // Check quyền xem
    let hasAccess = false;
    if (
      task.creator?.toString() === userId.toString() ||
      task.assignee?.toString() === userId.toString()
    ) {
      hasAccess = true;
    } else if (task.group) {
      const group = await Group.findById(task.group);
      if (group && group.members.includes(userId)) hasAccess = true;
    }

    if (!hasAccess) {
      res.status(403).json({ success: false, message: 'No permission' });
      return;
    }

    await task.populate('category', 'name color');
    await task.populate('group', 'name members');
    await task.populate('assignee', 'username avatar email');
    await task.populate('creator', 'username avatar');
    await task.populate({ path: 'comments', select: '_id' });
    await task.populate('timeEntries.user', 'username avatar');

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// --- GET TASKS ---
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
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .populate('category', 'name color')
      .populate('group', 'name')
      .populate('assignee', 'username avatar')
      .populate({ path: 'comments', select: '_id' })
      .populate('timeEntries.user', 'username avatar');

    res.status(200).json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching tasks' });
  }
};

// --- CREATE TASK ---
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

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    let imageUrl = '';
    if (files && files['image'] && files['image'][0]) {
      imageUrl = `uploads/${files['image'][0].filename}`;
    }

    let attachmentsData: any[] = [];
    if (files && files['attachments']) {
      attachmentsData = files['attachments'].map((file) => ({
        name: file.originalname,
        url: `uploads/${file.filename}`,
        type: file.mimetype,
        uploadDate: new Date(),
      }));
    }

    let subtasksData = [];
    if (req.body.subtasks) {
      try {
        subtasksData = JSON.parse(req.body.subtasks);
      } catch (e) {}
    }

    const newTask = new Task({
      title,
      description,
      image: imageUrl,
      dueDate: new Date(finalDate),
      priority: priority ? priority.toLowerCase() : 'moderate',
      status: status || 'todo',
      creator: creatorId,
      assignee: req.body.assignee || creatorId,
      group: groupId || null,
      category: categoryId || null,
      isDeleted: false,
      subtasks: subtasksData,
      attachments: attachmentsData,
    });

    await newTask.save();
    res.status(201).json({ success: true, task: newTask });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// --- UPDATE TASK ---
export const updateTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const oldTask = await Task.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!oldTask) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    const updateData: any = { ...req.body };
    if (updateData.priority)
      updateData.priority = updateData.priority.toLowerCase();
    if (updateData.date) updateData.dueDate = new Date(updateData.date);

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files && files['image'] && files['image'][0]) {
      updateData.image = `uploads/${files['image'][0].filename}`;
      if (oldTask.image) safeDeleteFile(oldTask.image);
    }

    if (updateData.subtasks) {
      try {
        updateData.subtasks = JSON.parse(updateData.subtasks);
      } catch (e) {}
    }

    let currentAttachments: any[] = [];
    if (updateData.existingAttachments) {
      try {
        currentAttachments = JSON.parse(updateData.existingAttachments);
      } catch (e) {}
      delete updateData.existingAttachments;
    }

    let newFiles: any[] = [];
    if (files && files['attachments']) {
      newFiles = files['attachments'].map((file) => ({
        name: file.originalname,
        url: `uploads/${file.filename}`,
        type: file.mimetype,
        uploadDate: new Date(),
      }));
    }

    const finalAttachments = [...currentAttachments, ...newFiles];
    updateData.attachments = finalAttachments;

    if (oldTask.attachments && oldTask.attachments.length > 0) {
      const keptFileUrls = new Set(finalAttachments.map((f: any) => f.url));
      oldTask.attachments.forEach((oldAtt: any) => {
        if (!keptFileUrls.has(oldAtt.url)) safeDeleteFile(oldAtt.url);
      });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    res.json({ success: true, task: updatedTask });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};

// 👇 [FIXED] DELETE TASK (SOFT DELETE)
// Thêm kiểm tra quyền: Chỉ Creator hoặc Assignee mới được xóa
export const deleteTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;

    // 1. Tìm task trước (không quan tâm đã xóa hay chưa để báo lỗi chính xác)
    const task = await Task.findOne({ _id: id, isDeleted: { $ne: true } });

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    // 2. [QUAN TRỌNG] Kiểm tra quyền hạn
    // Chỉ cho phép nếu là người tạo HOẶC người được giao việc
    const isCreator = task.creator.toString() === userId.toString();
    const isAssignee =
      task.assignee && task.assignee.toString() === userId.toString();

    if (!isCreator && !isAssignee) {
      res.status(403).json({
        success: false,
        message:
          'Bạn không có quyền xóa công việc này (chỉ người tạo hoặc người được giao mới có quyền).',
      });
      return;
    }

    // 3. Thực hiện Soft Delete
    task.isDeleted = true;
    task.deletedAt = new Date();
    await task.save();

    res.json({ success: true, message: 'Đã chuyển vào thùng rác' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
};

// 👇 [FIXED] GET TRASH TASKS
export const getTrashTasks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user._id;

    // Tìm các task đã bị xóa mềm MÀ (mình tạo HOẶC mình được giao)
    const tasks = await Task.find({
      isDeleted: true,
      $or: [
        { creator: userId },
        { assignee: userId }, // Đảm bảo Assignee cũng nhìn thấy rác của mình
      ],
    })
      .sort({ deletedAt: -1 })
      .populate('group', 'name')
      .populate('assignee', 'username avatar'); // Populate để hiển thị rõ ai là assignee

    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching trash' });
  }
};

// 👇 [FIXED] RESTORE TASK
export const restoreTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;

    const task = await Task.findOne({ _id: id, isDeleted: true });

    if (!task) {
      res.status(404).json({ success: false, message: 'Not found in trash' });
      return;
    }

    // Kiểm tra quyền restore (tương tự delete)
    const isCreator = task.creator.toString() === userId.toString();
    const isAssignee =
      task.assignee && task.assignee.toString() === userId.toString();

    if (!isCreator && !isAssignee) {
      res.status(403).json({ success: false, message: 'Permission denied' });
      return;
    }

    task.isDeleted = false;
    task.deletedAt = null;
    await task.save();

    res.json({ success: true, message: 'Restored successfully', task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Restore failed' });
  }
};

// 👇 [FIXED] FORCE DELETE TASK
export const forceDeleteTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;

    // Tìm task kể cả khi nó đã bị soft delete
    const task = await Task.findById(id);

    if (!task) {
      res.status(404).json({ success: false, message: 'Not found' });
      return;
    }

    // Kiểm tra quyền xóa vĩnh viễn
    const isCreator = task.creator.toString() === userId.toString();
    const isAssignee =
      task.assignee && task.assignee.toString() === userId.toString();

    if (!isCreator && !isAssignee) {
      res.status(403).json({ success: false, message: 'Permission denied' });
      return;
    }

    // Xóa file vật lý
    if (task.image) safeDeleteFile(task.image);
    if (task.attachments && task.attachments.length > 0) {
      task.attachments.forEach((att) => {
        safeDeleteFile(att.url);
      });
    }

    await Task.findByIdAndDelete(id);
    res.json({ success: true, message: 'Permanently deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Force delete failed' });
  }
};

// ... Các hàm khác giữ nguyên ...
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
      isDeleted: { $ne: true },
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
    res.json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const startTimer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;
    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }
    const isRunning = task.timeEntries.some(
      (entry) => entry.user.toString() === userId.toString() && !entry.endTime
    );
    if (isRunning) {
      res
        .status(400)
        .json({ success: false, message: 'Timer is already running for you.' });
      return;
    }
    task.timeEntries.push({
      user: userId,
      startTime: new Date(),
      duration: 0,
    });
    await task.save();
    await task.populate('timeEntries.user', 'username avatar');
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Start timer failed' });
  }
};

export const stopTimer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;
    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }
    const runningEntryIndex = task.timeEntries.findIndex(
      (entry) => entry.user.toString() === userId.toString() && !entry.endTime
    );
    if (runningEntryIndex === -1) {
      res
        .status(400)
        .json({ success: false, message: 'No running timer found' });
      return;
    }
    const now = new Date();
    const entry = task.timeEntries[runningEntryIndex];
    entry.endTime = now;
    const sessionDuration = now.getTime() - new Date(entry.startTime).getTime();
    entry.duration = sessionDuration;
    task.totalTime = (task.totalTime || 0) + sessionDuration;
    await task.save();
    await task.populate('timeEntries.user', 'username avatar');
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Stop timer failed' });
  }
};
