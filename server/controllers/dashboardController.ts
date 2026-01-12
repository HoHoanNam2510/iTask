/* server/controllers/dashboardController.ts */
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

    // 👇 [FIX] Định nghĩa bộ lọc chung:
    // 1. Phải là task của mình (tạo hoặc được giao)
    // 2. Chưa bị xóa (isDeleted != true)
    const baseQuery = {
      $or: [{ creator: userId }, { assignee: userId }],
      isDeleted: { $ne: true },
    };

    // 1. Lấy danh sách task trong ngày
    const tasksInDay = await Task.find({
      ...baseQuery,
      dueDate: { $gte: start, $lte: end },
    });

    // 2. Tính toán thống kê
    const stats = {
      total: tasksInDay.length,
      todo: tasksInDay.filter((t) => t.status === 'todo').length,
      inProgress: tasksInDay.filter((t) => t.status === 'in_progress').length,
      completed: tasksInDay.filter((t) => t.status === 'completed').length,
    };

    // 3. Dữ liệu biểu đồ 7 ngày
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(dateQuery, i);
      const s = startOfDay(d);
      const e = endOfDay(d);

      // 👇 [FIX] Áp dụng baseQuery vào countDocuments để loại bỏ task đã xóa
      const count = await Task.countDocuments({
        ...baseQuery,
        dueDate: { $gte: s, $lte: e }, // Lọc theo range ngày của cột đó
      });

      weeklyData.push({ name: format(d, 'dd/MM'), tasks: count });
    }

    res.json({ success: true, stats, weeklyData, tasks: tasksInDay });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
