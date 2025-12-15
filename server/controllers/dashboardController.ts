// server/controllers/dashboardController.ts
import { Request, Response } from 'express';
import Task from '../models/Task';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const dateQuery = req.query.date
      ? new Date(String(req.query.date))
      : new Date();

    const start = startOfDay(dateQuery);
    const end = endOfDay(dateQuery);

    // 1. Lấy danh sách task trong ngày
    const tasksInDay = await Task.find({
      creator: userId,
      dueDate: { $gte: start, $lte: end },
    }); // .sort({ priority: 1 }) // Có thể sort theo priority nếu muốn

    // 2. Tính toán thống kê (Giữ nguyên logic cũ)
    const stats = {
      total: tasksInDay.length,
      todo: tasksInDay.filter((t) => t.status === 'todo').length,
      inProgress: tasksInDay.filter((t) => t.status === 'in_progress').length,
      completed: tasksInDay.filter((t) => t.status === 'completed').length,
    };

    // 3. Dữ liệu biểu đồ 7 ngày (Giữ nguyên)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(dateQuery, i);
      const s = startOfDay(d);
      const e = endOfDay(d);
      const count = await Task.countDocuments({
        creator: userId,
        dueDate: { $gte: s, $lte: e },
      });
      weeklyData.push({ name: format(d, 'dd/MM'), tasks: count });
    }

    // 👇 TRẢ VỀ THÊM FIELD 'tasks' 👇
    res.json({ success: true, stats, weeklyData, tasks: tasksInDay });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
