/* server/controllers/taskController.ts */
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task';
import Group from '../models/Group';
import cloudinary from '../config/cloudinary';

// Helper: Xóa file trên Cloudinary
const deleteCloudImage = async (fileUrl: string | undefined) => {
  if (!fileUrl || !fileUrl.includes('cloudinary')) return;
  try {
    const splitUrl = fileUrl.split('/');
    const folderIndex = splitUrl.findIndex((part) => part === 'iTask_Uploads');
    if (folderIndex !== -1) {
      const publicIdWithExt = splitUrl.slice(folderIndex).join('/');
      let publicId = publicIdWithExt;
      await cloudinary.uploader
        .destroy(publicId, { resource_type: 'raw' })
        .catch(() => {});
      const publicIdNoExt = publicId.replace(/\.[^/.]+$/, '');
      await cloudinary.uploader.destroy(publicIdNoExt).catch(() => {});
    }
  } catch (error) {
    console.error(`❌ Error deleting cloud file:`, error);
  }
};

// Hàm Wrapper xóa file
const safeDeleteFile = async (filePath: string | undefined) => {
  if (!filePath) return;
  if (filePath.includes('cloudinary')) {
    await deleteCloudImage(filePath);
  }
};

export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    const userGroups = await Group.find({ members: userId }).distinct('_id');

    const tasks = await Task.find({
      isDeleted: { $ne: true },
      $or: [
        { group: { $in: userGroups } },
        { group: null, $or: [{ creator: userId }, { assignee: userId }] },
      ],
    })
      .sort({ createdAt: -1 })
      .populate('category', 'name color')
      .populate('group', 'name')
      .populate('assignee', 'username avatar')
      .populate('creator', 'username avatar')
      .populate('timeEntries.user', 'username avatar');

    res.status(200).json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy danh sách task' });
  }
};

// 👇 [UPDATED] Kiểm tra quyền xóa chặt chẽ
export const deleteTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const task = await Task.findOne({ _id: id, isDeleted: false });
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    let hasPermission = false;

    // 1. Admin quyền lực nhất
    if (user.role === 'admin') {
      hasPermission = true;
    }
    // 2. Creator (Người tạo) luôn có quyền xóa task mình tạo
    else if (task.creator.toString() === user._id.toString()) {
      hasPermission = true;
    }
    // 3. Group Owner (Chủ nhóm) có quyền xóa mọi task trong nhóm
    else if (task.group) {
      const group = await Group.findById(task.group);
      if (group && group.owner.toString() === user._id.toString()) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: 'Bạn chỉ được phép xóa công việc do bạn tạo ra.',
      });
      return;
    }

    task.isDeleted = true;
    task.deletedAt = new Date();
    await task.save();

    res.json({ success: true, message: 'Đã chuyển vào thùng rác' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
};

export const getTrashTasks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;
    const ownedGroups = await Group.find({ owner: user._id }).distinct('_id');

    const query: any = {
      isDeleted: true,
      $or: [
        { creator: user._id },
        { assignee: user._id },
        { group: { $in: ownedGroups } },
      ],
    };

    if (user.role === 'admin') delete query.$or;

    const tasks = await Task.find(query)
      .sort({ deletedAt: -1 })
      .populate('group', 'name')
      .populate('assignee', 'username avatar')
      .populate('creator', 'username avatar');

    res.json({ success: true, tasks });
  } catch (error) {
    console.error('Get Trash Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching trash' });
  }
};

export const restoreTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const task = await Task.findOne({ _id: id, isDeleted: true });
    if (!task) {
      res.status(404).json({ success: false, message: 'Not found in trash' });
      return;
    }

    let hasPermission = false;
    if (user.role === 'admin') hasPermission = true;
    if (task.creator.toString() === user._id.toString()) hasPermission = true;

    if (task.group) {
      const group = await Group.findById(task.group);
      if (group && group.owner.toString() === user._id.toString())
        hasPermission = true;
    }

    if (!hasPermission) {
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

export const forceDeleteTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ success: false, message: 'Not found' });
      return;
    }

    let hasPermission = false;
    if (user.role === 'admin') hasPermission = true;
    if (task.creator.toString() === user._id.toString()) hasPermission = true;

    if (task.group) {
      const group = await Group.findById(task.group);
      if (group && group.owner.toString() === user._id.toString())
        hasPermission = true;
    }

    if (!hasPermission) {
      res.status(403).json({ success: false, message: 'Permission denied' });
      return;
    }

    // Xóa ảnh trên Cloudinary
    if (task.image) await safeDeleteFile(task.image);
    if (task.attachments && task.attachments.length > 0) {
      for (const att of task.attachments) {
        await safeDeleteFile(att.url);
      }
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
    if (!q || typeof q !== 'string')
      return void res.json({ success: true, tasks: [] });
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

export const startTimer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;
    const task = await Task.findById(id);
    if (!task)
      return void res
        .status(404)
        .json({ success: false, message: 'Task not found' });
    if (
      task.timeEntries.some(
        (entry) => entry.user.toString() === userId.toString() && !entry.endTime
      )
    )
      return void res
        .status(400)
        .json({ success: false, message: 'Timer is already running.' });
    task.timeEntries.push({ user: userId, startTime: new Date(), duration: 0 });
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
    if (!task)
      return void res
        .status(404)
        .json({ success: false, message: 'Task not found' });
    const runningEntryIndex = task.timeEntries.findIndex(
      (entry) => entry.user.toString() === userId.toString() && !entry.endTime
    );
    if (runningEntryIndex === -1)
      return void res
        .status(400)
        .json({ success: false, message: 'No running timer found' });
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

export const getAllTasksAdmin = async (
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
    const query: any = { isDeleted: { $ne: true } };
    if (search) query.title = { $regex: search, $options: 'i' };
    const sortOption: any = { [sortBy]: order === 'asc' ? 1 : -1 };
    const tasks = await Task.find(query)
      .populate('creator', 'username email avatar')
      .populate('category', 'name color')
      .populate('group', 'name')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);
    const totalTasks = await Task.countDocuments(query);
    res.json({
      success: true,
      count: tasks.length,
      total: totalTasks,
      currentPage: page,
      totalPages: Math.ceil(totalTasks / limit),
      tasks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid Task ID' });
      return;
    }
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
    if ((req as any).user.role === 'admin') hasAccess = true;
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
    console.error('Get Task Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

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
      assignee,
    } = req.body;
    const finalDate = date || dueDate;

    if (!title || !finalDate) {
      res
        .status(400)
        .json({ success: false, message: 'Title and Date required' });
      return;
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // 1. Cover Image
    let imageUrl = '';
    if (files && files['image'] && files['image'][0])
      imageUrl = files['image'][0].path;

    // 2. Attachments
    let attachmentsData: any[] = [];
    if (files && files['attachments']) {
      attachmentsData = files['attachments'].map((file) => ({
        name: file.originalname, // Giữ tên gốc (VD: "Báo cáo.xlsx") để hiển thị
        url: file.path, // URL Cloudinary
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
      assignee: assignee || creatorId,
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
    const { deleteImage } = req.body;

    // Mapping Group/Category (Giữ nguyên logic cũ)
    if (oldTask.group) {
      updateData.group = oldTask.group;
      updateData.category = null;
    } else if (updateData.groupId) {
      updateData.group = updateData.groupId;
      updateData.category = null;
    } else {
      if (req.body.categoryId) updateData.category = req.body.categoryId;
      else if (req.body.categoryId === '') updateData.category = null;
    }

    if (updateData.priority)
      updateData.priority = updateData.priority.toLowerCase();
    if (updateData.date) updateData.dueDate = new Date(updateData.date);

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Update Image
    if (files && files['image'] && files['image'][0]) {
      updateData.image = files['image'][0].path;
      if (oldTask.image) await safeDeleteFile(oldTask.image);
    } else if (deleteImage === 'true') {
      if (oldTask.image) await safeDeleteFile(oldTask.image);
      updateData.image = '';
    }

    // Subtasks
    if (updateData.subtasks) {
      try {
        updateData.subtasks = JSON.parse(updateData.subtasks);
      } catch (e) {}
    }

    // Update Attachments
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
        name: file.originalname, // Giữ tên hiển thị
        url: file.path, // URL Cloud
        type: file.mimetype,
        uploadDate: new Date(),
      }));
    }
    const finalAttachments = [...currentAttachments, ...newFiles];
    updateData.attachments = finalAttachments;

    // Clean rác attachments
    if (oldTask.attachments && oldTask.attachments.length > 0) {
      const keptFileUrls = new Set(finalAttachments.map((f: any) => f.url));
      for (const oldAtt of oldTask.attachments) {
        if (!keptFileUrls.has(oldAtt.url)) {
          await safeDeleteFile(oldAtt.url);
        }
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )
      .populate('category', 'name color')
      .populate('group', 'name')
      .populate('assignee', 'username avatar')
      .populate('creator', 'username avatar')
      .populate('timeEntries.user', 'username avatar');

    res.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};
