import { Request, Response } from 'express';
import Task from '../models/Task';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

// [GET] /api/dashboard/summary?date=yyyy-mm-dd
export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const dateQuery = req.query.date
      ? new Date(String(req.query.date))
      : new Date();

    // 1. Lấy thống kê cho NGÀY ĐƯỢC CHỌN
    const start = startOfDay(dateQuery);
    const end = endOfDay(dateQuery);

    const tasksInDay = await Task.find({
      creator: userId,
      dueDate: { $gte: start, $lte: end },
    });

    const stats = {
      total: tasksInDay.length,
      todo: tasksInDay.filter((t) => t.status === 'todo').length,
      inProgress: tasksInDay.filter((t) => t.status === 'in_progress').length,
      completed: tasksInDay.filter((t) => t.status === 'completed').length,
    };

    // 2. Lấy dữ liệu biểu đồ cột (7 ngày tính từ ngày được chọn trở về trước)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(dateQuery, i);
      const s = startOfDay(d);
      const e = endOfDay(d);

      const count = await Task.countDocuments({
        creator: userId,
        dueDate: { $gte: s, $lte: e },
      });

      weeklyData.push({
        name: format(d, 'dd/MM'), // Tên trục X (VD: 12/12)
        tasks: count, // Giá trị trục Y
      });
    }

    res.json({ success: true, stats, weeklyData });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: 'Lỗi lấy dữ liệu dashboard' });
  }
};
