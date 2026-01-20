/* server/controllers/notificationController.ts */
import { Request, Response } from 'express';
import Notification from '../models/Notification';
import Group from '../models/Group'; // Cần import Group để lấy list member

// Lấy thông báo của tôi
export const getMyNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(20); // Tăng limit lên

    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải thông báo' });
  }
};

// Đánh dấu đã đọc
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

// Xóa thông báo
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    res.json({ success: true, message: 'Đã xóa thông báo' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa thông báo' });
  }
};

// 👇 [MỚI] API Gửi thông báo họp nhóm
export const createMeetingNotification = async (
  req: Request,
  res: Response
) => {
  try {
    const senderId = (req as any).user._id;
    const { groupId, groupName } = req.body;

    // 1. Tìm group để lấy danh sách thành viên
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // 2. Tạo thông báo cho TẤT CẢ thành viên (trừ người bấm gọi)
    const notifications = group.members
      .filter((m) => m.toString() !== senderId.toString())
      .map((recipientId) => ({
        recipient: recipientId,
        sender: senderId,
        type: 'invite', // Loại thông báo mời
        text: `đang bắt đầu cuộc họp trong nhóm ${groupName}. Tham gia ngay!`,
        link: `/groups/${groupId}`, // Link click vào là nhảy tới group
        isRead: false,
        createdAt: new Date(),
      }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({ success: true, message: 'Đã gửi thông báo họp' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi gửi thông báo họp' });
  }
};
