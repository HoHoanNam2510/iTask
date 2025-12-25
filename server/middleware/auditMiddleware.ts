/* server/middleware/auditMiddleware.ts */
import { Request, Response, NextFunction } from 'express';
import AuditLog from '../models/AuditLog';

export const auditLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. Bỏ qua phương thức GET
  if (req.method === 'GET') {
    return next();
  }

  // 2. "Đánh cắp" Response Body để lấy ID khi CREATE
  // Chúng ta cần override hàm res.json để lưu lại dữ liệu trước khi gửi đi
  let responseBody: any = null;
  const originalJson = res.json;

  res.json = function (body) {
    responseBody = body;
    return originalJson.call(this, body);
  };

  // 3. Lắng nghe sự kiện khi request kết thúc
  res.on('finish', async () => {
    // Chỉ log thành công hoặc lỗi server, bỏ qua 401/403 nếu muốn
    // if (res.statusCode >= 400 && res.statusCode !== 500) return;

    try {
      const user = (req as any).user;
      if (!user) return;

      let action = 'UNKNOWN';
      switch (req.method) {
        case 'POST':
          action = 'CREATE';
          break;
        case 'PUT':
          action = 'UPDATE';
          break;
        case 'DELETE':
          action = 'DELETE';
          break;
      }

      // Xác định Collection từ URL
      const parts = req.originalUrl.split('/');
      const collectionName = parts[2] ? parts[2].toUpperCase() : 'UNKNOWN';

      // --- LOGIC TÌM ID MỚI (QUAN TRỌNG) ---
      let targetId =
        parts[3] && mongoose.isValidObjectId(parts[3]) ? parts[3] : undefined;

      // Nếu là CREATE (chưa có ID trên URL) -> Lấy từ Response Body
      if (action === 'CREATE' && responseBody && responseBody.success) {
        // Tìm ID trong các trường phổ biến trả về từ API
        // Ví dụ: res.json({ success: true, task: { _id: "..." } })
        if (responseBody.task?._id) targetId = responseBody.task._id;
        else if (responseBody.group?._id) targetId = responseBody.group._id;
        else if (responseBody.user?._id) targetId = responseBody.user._id;
        else if (responseBody.category?._id)
          targetId = responseBody.category._id;
        else if (responseBody.comment?._id) targetId = responseBody.comment._id;
        // Fallback: Nếu trả về trực tiếp object có _id
        else if (responseBody._id) targetId = responseBody._id;
      }
      // -------------------------------------

      const ip =
        req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';

      await AuditLog.create({
        user: user._id,
        action: action,
        collectionName: collectionName,
        targetId: targetId, // Giờ đây CREATE cũng sẽ có ID
        details: {
          method: req.method,
          url: req.originalUrl,
          // Chỉ lưu body gửi lên khi không phải là upload file (để tránh rác log)
          body: !req.is('multipart/form-data')
            ? req.body
            : { msg: 'Multipart Data' },
        },
        ipAddress: Array.isArray(ip) ? ip[0] : ip,
        userAgent: req.headers['user-agent'],
        status: res.statusCode >= 400 ? 'FAILURE' : 'SUCCESS',
      });

      console.log(
        `📝 Audit Log Saved: ${action} ${collectionName} ${targetId || ''}`
      );
    } catch (error) {
      console.error('Audit Log Error:', error);
    }
  });

  next();
};

// Hàm helper để import mongoose check ID
import mongoose from 'mongoose';
