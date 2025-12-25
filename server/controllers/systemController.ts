/* server/controllers/systemController.ts */
import { Request, Response } from 'express';
import SystemConfig from '../models/SystemConfig';

// [GET] Lấy cấu hình (Public hoặc Logged in User đều xem được)
export const getSystemConfig = async (req: Request, res: Response) => {
  try {
    // Luôn lấy bản ghi đầu tiên
    let config = await SystemConfig.findOne();

    // Nếu chưa có (lần đầu chạy app), tạo mặc định
    if (!config) {
      config = await SystemConfig.create({
        globalBanner: { isActive: false, content: '', type: 'info' },
      });
    }

    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy cấu hình' });
  }
};

// [PUT] Cập nhật cấu hình (Chỉ Admin)
export const updateSystemConfig = async (req: Request, res: Response) => {
  try {
    const { globalBanner, maintenanceMode } = req.body;

    // Dùng findOneAndUpdate với upsert: true để đảm bảo luôn update cái đầu tiên
    const config = await SystemConfig.findOneAndUpdate(
      {}, // Filter rỗng để lấy cái đầu tiên
      {
        $set: {
          globalBanner,
          maintenanceMode,
        },
      },
      { new: true, upsert: true } // Trả về bản mới, tạo nếu chưa có
    );

    res.json({
      success: true,
      message: 'Cập nhật cấu hình thành công',
      config,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi cập nhật cấu hình' });
  }
};
