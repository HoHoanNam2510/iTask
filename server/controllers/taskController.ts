import { Request, Response } from 'express';
import Task from '../models/Task';

// [POST] /api/tasks
export const createTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // 1. Lấy dữ liệu text từ form
    const { title, description, date, priority, status, groupId, categoryId } =
      req.body;

    // 2. Lấy đường dẫn file ảnh (nếu có upload)
    let imageUrl = '';
    if (req.file) {
      // Lưu đường dẫn tương đối để frontend dễ gọi
      // VD: uploads/image-123123.png
      imageUrl = req.file.path.replace(/\\/g, '/'); // Fix lỗi đường dẫn ngược trên Windows
    }

    // 3. Xử lý logic Assignee & Group (như đã bàn ở bài trước)
    // Giả sử userId lấy từ middleware auth (req.user.id)
    const creatorId = (req as any).user?._id;

    // Nếu tạo trong Group thì GroupId sẽ có giá trị, nếu không thì null
    const group = groupId ? groupId : null;

    // Nếu là Personal Task (group == null) -> assignee là chính mình
    // Nếu là Group Task -> assignee lấy từ form hoặc mặc định là mình
    const assignee = req.body.assignee ? req.body.assignee : creatorId;

    // 4. Tạo Task mới
    const newTask = new Task({
      title,
      description,
      image: imageUrl, // Lưu url ảnh vào đây
      dueDate: new Date(date),
      priority,
      status: status || 'todo',
      creator: creatorId,
      assignee: assignee,
      group: group,
      category: categoryId || null,
    });

    await newTask.save();

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: newTask,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
