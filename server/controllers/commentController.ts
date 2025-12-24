import { Request, Response } from 'express';
import Comment from '../models/Comment';
import User from '../models/User';
import Task from '../models/Task';
import Group from '../models/Group';
import Notification from '../models/Notification';

// [POST] /api/comments
export const addComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { taskId, content } = req.body;
    const senderId = (req as any).user._id;

    // 1. Lưu Comment (Phần này quan trọng nhất, phải chạy được)
    const newComment = new Comment({
      task: taskId,
      user: senderId,
      content,
    });
    await newComment.save();
    // Populate user để trả về cho Frontend hiển thị ngay lập tức
    await newComment.populate('user', 'username avatar');

    // 2. Logic Notification (Bọc try-catch riêng để không làm crash API comment)
    try {
      const mentionRegex = /@(\w+)/g;
      const matches = content.match(mentionRegex);

      if (matches) {
        const usernames: string[] = [
          ...new Set<string>(matches.map((m: string) => m.slice(1))),
        ];
        const mentionedUsers = await User.find({
          username: { $in: usernames },
        });
        const task = await Task.findById(taskId);

        if (task && task.group) {
          // Chỉ xử lý nếu Task thuộc Group
          const group = await Group.findById(task.group);

          if (group) {
            const allowedUserIds = group.members.map((m) => m.toString());

            const notifications = mentionedUsers
              .filter((u) => {
                const uid = u._id.toString();
                return uid !== senderId && allowedUserIds.includes(uid);
              })
              .map((u) => ({
                recipient: u._id,
                sender: senderId,
                type: 'mention',
                text: `đã nhắc đến bạn trong một bình luận: "${content.substring(
                  0,
                  30
                )}..."`,
                link: taskId,
                isRead: false,
              }));

            if (notifications.length > 0) {
              await Notification.insertMany(notifications);
            }
          }
        }
      }
    } catch (notifyError) {
      // Nếu lỗi thông báo, chỉ log ra console server, KHÔNG return lỗi 500 cho client
      console.error(
        '⚠️ Lỗi tạo thông báo (Comment vẫn được lưu):',
        notifyError
      );
    }

    // 3. Trả về kết quả thành công
    res.status(201).json({ success: true, comment: newComment });
  } catch (error) {
    console.error('🔥 Lỗi lưu comment:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
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

// [PUT] /api/comments/:id
export const updateComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = (req as any).user._id;

    const comment = await Comment.findById(id);
    if (!comment) {
      res
        .status(404)
        .json({ success: false, message: 'Bình luận không tồn tại' });
      return;
    }

    // Check quyền: Chỉ chủ sở hữu mới được sửa
    if (comment.user.toString() !== userId.toString()) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền sửa bình luận này',
      });
      return;
    }

    comment.content = content;
    await comment.save();

    // Populate lại user để trả về frontend hiển thị luôn (avatar, name...)
    await comment.populate('user', 'username avatar');

    res.json({ success: true, comment });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Lỗi khi cập nhật bình luận' });
  }
};

// [DELETE] /api/comments/:id
export const deleteComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;

    const comment = await Comment.findById(id);
    if (!comment) {
      res
        .status(404)
        .json({ success: false, message: 'Bình luận không tồn tại' });
      return;
    }

    // Check quyền: Chỉ chủ sở hữu mới được xóa
    if (comment.user.toString() !== userId.toString()) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa bình luận này',
      });
      return;
    }

    await Comment.findByIdAndDelete(id);

    res.json({ success: true, message: 'Đã xóa bình luận' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa bình luận' });
  }
};
