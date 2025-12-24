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

    // 1. Lưu Comment (Giữ nguyên)
    const newComment = new Comment({
      /*...*/
    });
    await newComment.save();
    await newComment.populate('user', 'username avatar');

    // ---------------------------------------------------------
    // 👇 [SỬA LẠI] LOGIC NOTIFICATION (TỐI ƯU)
    // ---------------------------------------------------------

    const mentionRegex = /@(\w+)/g;
    const matches = content.match(mentionRegex);

    // Chỉ chạy logic notification nếu có @mention
    if (matches) {
      const usernames: string[] = [
        ...new Set<string>(matches.map((m: string) => m.slice(1))),
      ];

      // Tìm user ID
      const mentionedUsers = await User.find({ username: { $in: usernames } });

      const task = await Task.findById(taskId);

      if (task) {
        let allowedUserIds: string[] = [];

        // 👇 [QUAN TRỌNG] Chỉ xử lý nếu là Task Group
        if (task.group) {
          const group = await Group.findById(task.group);
          if (group) {
            // Convert ObjectId sang string để so sánh
            allowedUserIds = group.members.map((m) => m.toString());
          }
        }
        // ❌ [ĐÃ XÓA] Đoạn else { allowedUserIds.push(creator, assignee) } cũ.
        // Nếu không có group -> allowedUserIds rỗng -> Không gửi thông báo nào.

        // Nếu có danh sách cho phép (tức là đang trong Group), mới tạo thông báo
        if (allowedUserIds.length > 0) {
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
    // 👆 [HẾT PHẦN SỬA]

    res.status(201).json({ success: true, comment: newComment });
  } catch (error) {
    console.error(error);
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
