import { Request, Response } from 'express';
import Comment from '../models/Comment';

// [POST] /api/comments
export const addComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { taskId, content } = req.body;
    const userId = (req as any).user._id;

    if (!content.trim()) {
      res
        .status(400)
        .json({ success: false, message: 'Nội dung không được để trống' });
      return;
    }

    const newComment = new Comment({
      task: taskId,
      user: userId,
      content,
    });

    await newComment.save();

    // Populate thông tin user ngay để trả về frontend hiển thị luôn
    await newComment.populate('user', 'username avatar');

    res.status(201).json({ success: true, comment: newComment });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Lỗi server khi bình luận' });
  }
};

// [GET] /api/comments/:taskId
export const getTaskComments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { taskId } = req.params;

    const comments = await Comment.find({ task: taskId })
      .populate('user', 'username avatar') // Lấy tên và ảnh người comment
      .sort({ createdAt: 1 }); // Cũ nhất ở trên, mới nhất ở dưới (kiểu chat)

    res.json({ success: true, comments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải bình luận' });
  }
};
