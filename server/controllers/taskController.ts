import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task';

// [GET] /api/tasks
export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;

    // Lấy tất cả task mà user là người tạo HOẶC được gán
    // Sắp xếp theo ngày tạo mới nhất (sort -1)
    const tasks = await Task.find({
      $or: [{ creator: userId }, { assignee: userId }],
    })
      .sort({ createdAt: -1 })
      .populate('category', 'name color') // Nếu muốn lấy chi tiết category
      .populate('group', 'name'); // Nếu muốn lấy chi tiết group

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

  // Thay đổi kiểu return để tránh lỗi TS
  try {
    // 1. Kiểm tra Auth trước (Quan trọng!)
    const creatorId = (req as any).user?._id;
    if (!creatorId) {
      res
        .status(401)
        .json({ success: false, message: 'Unauthorized: User not found' });
      return;
    }

    // 2. Lấy dữ liệu
    // Lưu ý: Frontend cần gửi key 'date' hoặc 'dueDate' đều được xử lý
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

    // Kiểm tra field bắt buộc: Title và Date
    const finalDate = date || dueDate; // Ưu tiên cái nào có dữ liệu
    if (!title || !finalDate) {
      res
        .status(400)
        .json({ success: false, message: 'Title and Date are required' });
      return;
    }

    // 3. Xử lý ảnh
    let imageUrl = '';
    if (req.file) {
      imageUrl = req.file.path.replace(/\\/g, '/');
    }

    // 4. Xử lý Logic Group/Assignee
    const group = groupId ? groupId : null;
    const assignee = req.body.assignee ? req.body.assignee : creatorId;

    // 5. Xử lý Priority (Chuyển về chữ thường để khớp với Enum của Model)
    // Nếu không gửi lên thì mặc định là 'moderate'
    const finalPriority = priority ? priority.toLowerCase() : 'moderate';

    // 6. Tạo Task
    const newTask = new Task({
      title,
      description,
      image: imageUrl,
      dueDate: new Date(finalDate), // Đảm bảo format Date
      priority: finalPriority,
      status: status || 'todo',
      creator: creatorId,
      assignee: assignee,
      group: group,
      category: categoryId || null,
    });

    await newTask.save();

    console.log(`✅ Đã lưu Task "${newTask.title}" với ID: ${newTask._id}`);
    console.log(`📂 Vào Database: ${mongoose.connection.name}`);
    console.log(`📚 Vào Collection: ${newTask.collection.name}`);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: newTask,
    });
  } catch (error: any) {
    console.error('Create Task Error:', error); // Log lỗi ra terminal để debug

    // Bắt lỗi Validation của Mongoose để trả về frontend dễ hiểu hơn
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

    // 1. Lấy dữ liệu dạng text từ Form
    const updateData: any = { ...req.body };

    // 2. Kiểm tra nếu người dùng có upload ảnh mới
    if (req.file) {
      // Lưu đường dẫn ảnh mới vào DB (chuẩn hóa dấu gạch chéo)
      updateData.image = req.file.path.replace(/\\/g, '/');
    }

    // 3. Xử lý Priority (nếu có gửi lên thì lowercase)
    if (updateData.priority) {
      updateData.priority = updateData.priority.toLowerCase();
    }

    // 4. Xử lý Date (nếu có gửi lên)
    if (updateData.date) {
      updateData.dueDate = new Date(updateData.date);
    }

    // 5. Tìm và Update
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
    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
};
