import { Request, Response } from 'express';
import Feedback from '../models/Feedback';

export const createFeedback = async (req: Request, res: Response) => {
  try {
    const { subject, message } = req.body;
    const userId = (req as any).user._id;

    const newFeedback = new Feedback({
      user: userId,
      subject,
      message,
    });

    await newFeedback.save();
    res.status(201).json({ success: true, message: 'Đã gửi phản hồi' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi gửi phản hồi' });
  }
};
