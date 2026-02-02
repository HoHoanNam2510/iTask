/* server/controllers/taskController.ts */
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Task from '../models/Task';
import Group from '../models/Group';

const getLocalPath = (dbPath: string) => {
  return path.join(process.cwd(), '../', dbPath);
};

const safeDeleteFile = (dbPath: string | undefined) => {
  if (!dbPath || dbPath.startsWith('http')) return;
  try {
    const absolutePath = getLocalPath(dbPath);
    if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
  } catch (error) {
    console.error(`❌ Error deleting file ${dbPath}:`, error);
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
      // 👇 [FIX] Populate user trong timeEntries để hiển thị đúng tên người làm
      .populate('timeEntries.user', 'username avatar');

    res.status(200).json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy danh sách task' });
  }
};

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
    if (user.role === 'admin') hasPermission = true;
    else if (task.creator.toString() === user._id.toString())
      hasPermission = true;
    else if (task.group) {
      const group = await Group.findById(task.group);
      if (group && group.owner.toString() === user._id.toString()) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa task này.',
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

    if (task.image) safeDeleteFile(task.image);
    if (task.attachments && task.attachments.length > 0) {
      task.attachments.forEach((att) => safeDeleteFile(att.url));
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
    let imageUrl = '';
    if (files && files['image'] && files['image'][0])
      imageUrl = `uploads/${files['image'][0].filename}`;
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

// [UPDATED] Hàm updateTask đã bổ sung populate để fix lỗi "Unknown User"
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

    // 1. Logic Category/Group Mapping
    if (oldTask.group) {
      updateData.group = oldTask.group;
      updateData.category = null;
    } else if (updateData.groupId) {
      updateData.group = updateData.groupId;
      updateData.category = null;
    } else {
      if (req.body.categoryId) {
        updateData.category = req.body.categoryId;
      } else if (req.body.categoryId === '') {
        updateData.category = null;
      }
    }

    if (updateData.priority)
      updateData.priority = updateData.priority.toLowerCase();
    if (updateData.date) updateData.dueDate = new Date(updateData.date);

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // 2. Logic xử lý ảnh
    if (files && files['image'] && files['image'][0]) {
      updateData.image = `uploads/${files['image'][0].filename}`;
      if (oldTask.image) safeDeleteFile(oldTask.image);
    } else if (deleteImage === 'true') {
      if (oldTask.image) safeDeleteFile(oldTask.image);
      updateData.image = '';
    }

    // 3. Logic subtasks
    if (updateData.subtasks) {
      try {
        updateData.subtasks = JSON.parse(updateData.subtasks);
      } catch (e) {}
    }

    // 4. Logic attachments
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
    )
      .populate('category', 'name color')
      .populate('group', 'name')
      // 👇 [FIX] Thêm populate assignee, creator và timeEntries.user
      .populate('assignee', 'username avatar')
      .populate('creator', 'username avatar')
      .populate('timeEntries.user', 'username avatar');

    res.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};
