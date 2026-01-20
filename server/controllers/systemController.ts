/* server/controllers/systemController.ts */
import { Request, Response } from 'express';
import SystemConfig from '../models/SystemConfig';
import { generateToken04 } from '../utils/zegoServerAssistant';

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

// 👇 [MỚI] API tạo Token Zego
export const getZegoToken = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // 👇 [FIXED] Ưu tiên lấy userId từ Query (do Client gửi lên) để khớp với session
    // Nếu không có thì mới lấy mặc định từ DB
    const clientUserId = req.query.userId as string;
    const userId = clientUserId || user._id.toString();

    const appID = Number(process.env.ZEGO_APP_ID);
    const serverSecret = process.env.ZEGO_SERVER_SECRET || '';

    // Log kiểm tra
    console.log('🔹 Generating Zego Token:', {
      appID,
      userId, // ID này phải khớp với ID ở VideoRoom.tsx
      secretLength: serverSecret.length,
    });

    if (!appID || !serverSecret) {
      return res
        .status(500)
        .json({ success: false, message: 'Missing Zego Config' });
    }

    const effectiveTimeInSeconds = 3600;
    const payload = '';

    const token = generateToken04(
      appID,
      userId,
      serverSecret,
      effectiveTimeInSeconds,
      payload
    );

    res.json({ success: true, token, appID, userId }); // Trả về cả userId để client dùng
  } catch (error) {
    console.error('Zego Token Error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to generate token' });
  }
};
