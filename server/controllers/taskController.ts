/* server/controllers/taskController.ts */
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import Task from '../models/Task';
import Group from '../models/Group';

const getLocalImagePath = (dbPath: string) => {
  return path.join(process.cwd(), '../', dbPath); // Điều chỉnh path tùy cấu trúc folder của bạn
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

    // 3. Xử lý Subtasks (Do gửi qua FormData nên nó là chuỗi JSON)
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
    const updateData: any = { ...req.body };

    // 1. Format dữ liệu cơ bản
    if (updateData.priority)
      updateData.priority = updateData.priority.toLowerCase();
    if (updateData.date) updateData.dueDate = new Date(updateData.date);

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // 2. Xử lý Ảnh bìa (Image)
    if (files && files['image'] && files['image'][0]) {
      updateData.image = `uploads/${files['image'][0].filename}`;
    }

    // 3. Xử lý Subtasks (Parse JSON)
    if (updateData.subtasks) {
      try {
        updateData.subtasks = JSON.parse(updateData.subtasks);
      } catch (e) {
        // Nếu lỗi parse thì bỏ qua
      }
    }

    // 4. Xử lý Attachments (QUAN TRỌNG: Logic Gộp & Xóa)
    // Bước A: Lấy danh sách file cũ người dùng muốn giữ lại (từ JSON string)
    let currentAttachments: any[] = [];
    if (updateData.existingAttachments) {
      try {
        currentAttachments = JSON.parse(updateData.existingAttachments);
      } catch (e) {
        console.error('Parse existingAttachments error', e);
      }
      // Xóa field này khỏi updateData để không bị lỗi query vào DB
      delete updateData.existingAttachments;
    }

    // Bước B: Xử lý file mới upload
    let newFiles: any[] = [];
    if (files && files['attachments']) {
      newFiles = files['attachments'].map((file) => ({
        name: file.originalname,
        url: `uploads/${file.filename}`,
        type: file.mimetype,
        uploadDate: new Date(),
      }));
    }

    // Bước C: Gộp File Cũ + File Mới = Danh sách cuối cùng
    // 👇 Logic này sẽ thay thế toàn bộ mảng attachments trong DB,
    // giúp loại bỏ những file mà người dùng đã bấm X (vì chúng không có trong existingAttachments)
    const finalAttachments = [...currentAttachments, ...newFiles];
    updateData.attachments = finalAttachments;

    // 5. Thực hiện Update
    // Sử dụng findOneAndUpdate với $set (đã bao gồm trong updateData)
    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { $set: updateData }, // $set sẽ ghi đè toàn bộ mảng attachments
      { new: true }
    );

    if (!updatedTask) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    res.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error('Update Task Error:', error);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};

// --- DELETE TASK ---
export const deleteTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const task = await Task.findOne({ _id: id, isDeleted: { $ne: true } });

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    task.isDeleted = true;
    task.deletedAt = new Date();
    await task.save();

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
    // Xóa ảnh cover
    if (task.image && !task.image.startsWith('http')) {
      const imagePath = getLocalImagePath(task.image);
      if (fs.existsSync(imagePath))
        try {
          fs.unlinkSync(imagePath);
        } catch (e) {}
    }
    // Xóa file attachments
    if (task.attachments && task.attachments.length > 0) {
      task.attachments.forEach((att) => {
        if (att.url && !att.url.startsWith('http')) {
          const attPath = getLocalImagePath(att.url);
          if (fs.existsSync(attPath))
            try {
              fs.unlinkSync(attPath);
            } catch (e) {}
        }
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
