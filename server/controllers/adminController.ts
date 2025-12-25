/* server/controllers/adminController.ts */
import { Request, Response } from 'express';
import AuditLog from '../models/AuditLog';
import User from '../models/User';
import Group from '../models/Group';
import Task from '../models/Task';

// 1. Lấy danh sách Nhật ký hoạt động (Audit Logs)
export const getSystemLogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Filter cơ bản
    const filter: any = {};
    if (req.query.action) filter.action = req.query.action;
    if (req.query.userId) filter.user = req.query.userId;

    const logs = await AuditLog.find(filter)
      .populate('user', 'username email avatar') // Hiện thông tin người làm
      .sort({ createdAt: -1 }) // Mới nhất lên đầu
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments(filter);

    res.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get Logs Error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Lỗi tải nhật ký hệ thống' });
  }
};

// 2. (Tùy chọn) Dashboard Stats - Thống kê tổng quan cho Admin
export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalGroups = await Group.countDocuments();
    const totalTasks = await Task.countDocuments();

    res.json({
      success: true,
      stats: {
        users: totalUsers,
        groups: totalGroups,
        tasks: totalTasks,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải thống kê' });
  }
};
