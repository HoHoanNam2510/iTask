/* server/controllers/notificationController.ts */
import { Request, Response } from 'express';
import Notification from '../models/Notification';

// Lấy thông báo của tôi
export const getMyNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'username avatar') // Để hiện avatar người gửi
      .sort({ createdAt: -1 })
      .limit(10); // Lấy 10 cái mới nhất

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

// 👇 [MỚI] Hàm xóa thông báo
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    res.json({ success: true, message: 'Đã xóa thông báo' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa thông báo' });
  }
};
