/* server/controllers/taskController.ts */
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import Task from '../models/Task';
import Group from '../models/Group';

// 👇 [MỚI] Helper: Lấy đường dẫn file vật lý và Xóa an toàn
const getLocalPath = (dbPath: string) => {
  // Giả sử structure: /root/server (cwd) và /root/uploads
  // ../uploads sẽ trỏ ra folder uploads nằm ngang hàng với server
  return path.join(process.cwd(), '../', dbPath);
};

const safeDeleteFile = (dbPath: string | undefined) => {
  if (!dbPath || dbPath.startsWith('http')) return;

  try {
    const absolutePath = getLocalPath(dbPath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      console.log(`🗑️ Deleted file: ${dbPath}`);
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
      .populate('assignee', 'username avatar');

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

    // Xử lý files từ upload.fields
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // 1. Xử lý Ảnh bìa (Image)
    let imageUrl = '';
    if (files && files['image'] && files['image'][0]) {
      imageUrl = `uploads/${files['image'][0].filename}`;
    }

    // 2. Xử lý File đính kèm (Attachments)
    let attachmentsData: any[] = [];
    if (files && files['attachments']) {
      attachmentsData = files['attachments'].map((file) => ({
        name: file.originalname,
        url: `uploads/${file.filename}`,
        type: file.mimetype,
        uploadDate: new Date(),
      }));
    }

    // 3. Xử lý Subtasks
    let subtasksData = [];
    if (req.body.subtasks) {
      try {
        subtasksData = JSON.parse(req.body.subtasks);
      } catch (e) {
        console.error('Parse subtasks error', e);
      }
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
    console.error(error);
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

    // 👇 [BƯỚC 1] Lấy task cũ trước khi update để so sánh file
    const oldTask = await Task.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!oldTask) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    const updateData: any = { ...req.body };

    // Format dữ liệu cơ bản
    if (updateData.priority)
      updateData.priority = updateData.priority.toLowerCase();
    if (updateData.date) updateData.dueDate = new Date(updateData.date);

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // 👇 [BƯỚC 2] Xử lý Ảnh bìa (Image) & Cleanup
    if (files && files['image'] && files['image'][0]) {
      // Set ảnh mới
      updateData.image = `uploads/${files['image'][0].filename}`;

      // 🧹 [CLEANUP] Nếu task cũ đã có ảnh thì xóa đi
      if (oldTask.image) {
        safeDeleteFile(oldTask.image);
      }
    }

    // Xử lý Subtasks
    if (updateData.subtasks) {
      try {
        updateData.subtasks = JSON.parse(updateData.subtasks);
      } catch (e) {}
    }

    // 👇 [BƯỚC 3] Xử lý Attachments & Cleanup

    // A. Parse danh sách file cũ người dùng muốn GIỮ LẠI
    let currentAttachments: any[] = [];
    if (updateData.existingAttachments) {
      try {
        currentAttachments = JSON.parse(updateData.existingAttachments);
      } catch (e) {
        console.error('Parse existingAttachments error', e);
      }
      delete updateData.existingAttachments; // Xóa field này để tránh lỗi khi save DB
    }

    // B. Tạo danh sách file MỚI upload
    let newFiles: any[] = [];
    if (files && files['attachments']) {
      newFiles = files['attachments'].map((file) => ({
        name: file.originalname,
        url: `uploads/${file.filename}`,
        type: file.mimetype,
        uploadDate: new Date(),
      }));
    }

    // C. Gộp lại thành mảng cuối cùng
    const finalAttachments = [...currentAttachments, ...newFiles];
    updateData.attachments = finalAttachments;

    // 🧹 [CLEANUP] Xóa các file đính kèm đã bị người dùng gỡ bỏ (không có trong finalAttachments)
    if (oldTask.attachments && oldTask.attachments.length > 0) {
      // Tạo Set các URL được giữ lại để tra cứu O(1)
      const keptFileUrls = new Set(finalAttachments.map((f: any) => f.url));

      oldTask.attachments.forEach((oldAtt: any) => {
        // Nếu URL cũ không nằm trong danh sách giữ lại -> XÓA
        if (!keptFileUrls.has(oldAtt.url)) {
          safeDeleteFile(oldAtt.url);
        }
      });
    }

    // 4. Update DB
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    res.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error('Update Task Error:', error);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};

// --- DELETE TASK (Soft Delete) ---
export const deleteTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    // Soft delete: Chỉ đánh dấu đã xóa, KHÔNG xóa file vật lý
    const task = await Task.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    );

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    res.json({ success: true, message: 'Moved task to trash' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
};

// --- TRASH & OTHER ACTIONS ---
export const getTrashTasks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    const tasks = await Task.find({ creator: userId, isDeleted: true })
      .sort({ deletedAt: -1 })
      .populate('group', 'name');
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching trash' });
  }
};

export const restoreTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const task = await Task.findOne({ _id: id, isDeleted: true });
    if (!task) {
      res.status(404).json({ success: false, message: 'Not found' });
      return;
    }
    task.isDeleted = false;
    task.deletedAt = null;
    await task.save();
    res.json({ success: true, message: 'Restored', task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Restore failed' });
  }
};

// --- FORCE DELETE (Xóa vĩnh viễn & Dọn sạch file) ---
export const forceDeleteTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ success: false, message: 'Not found' });
      return;
    }

    // 🧹 [CLEANUP] Xóa ảnh cover
    if (task.image) {
      safeDeleteFile(task.image);
    }

    // 🧹 [CLEANUP] Xóa file attachments
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
