/* server/controllers/feedbackController.ts */
import { Request, Response } from 'express';
import Feedback from '../models/Feedback';

// User: Gửi feedback
export const createFeedback = async (req: Request, res: Response) => {
  try {
    const { subject, message, type } = req.body;
    const userId = (req as any).user._id;

    const newFeedback = new Feedback({
      user: userId,
      subject,
      message,
      type: type || 'other',
    });

    await newFeedback.save();
    res
      .status(201)
      .json({ success: true, message: 'Đã gửi phản hồi thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi gửi phản hồi' });
  }
};

// Admin: Lấy danh sách feedback (có Filter & Pagination & Sort)
export const getAllFeedbacks = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';

    // 👇 [MỚI] Lấy tham số sort
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const order = (req.query.order as string) === 'asc' ? 1 : -1;

    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const feedbacks = await Feedback.find(query)
      .populate('user', 'username email avatar')
      .sort({ [sortBy]: order }) // 👇 Áp dụng sort động
      .skip(skip)
      .limit(limit);

    const total = await Feedback.countDocuments(query);

    res.json({
      success: true,
      feedbacks,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Lỗi lấy danh sách feedback' });
  }
};

// Admin: Cập nhật trạng thái
export const updateFeedback = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminResponse } = req.body;

    const updatedFeedback = await Feedback.findByIdAndUpdate(
      id,
      { status, adminResponse },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Cập nhật thành công',
      feedback: updatedFeedback,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật feedback' });
  }
};

// Admin: Xóa feedback
export const deleteFeedback = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Feedback.findByIdAndDelete(id);
    res.json({ success: true, message: 'Đã xóa feedback' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xóa feedback' });
  }
};
