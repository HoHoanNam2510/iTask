import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Interface định nghĩa dữ liệu có trong Token (khi decode ra)
interface UserPayload {
  _id: string;
  email: string;
  // thêm các trường khác nếu bạn lưu trong token
}

// Mở rộng Request của Express để TypeScript không báo lỗi khi gọi req.user
// Tuy nhiên, cách nhanh nhất để không phải config file d.ts phức tạp là dùng (req as any) hoặc custom interface
export interface AuthRequest extends Request {
  user?: UserPayload;
}

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 1. Lấy token từ header (Client gửi dạng: "Bearer <token_string>")
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1]; // Lấy phần chuỗi token sau chữ Bearer

  // 2. Nếu không có token -> Chặn luôn (401 Unauthorized)
  if (!token) {
    res
      .status(401)
      .json({ success: false, message: 'Access Denied: No Token Provided' });
    return;
  }

  try {
    // 3. Verify token bằng Secret Key
    // Lưu ý: process.env.JWT_SECRET cần được định nghĩa trong .env
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in .env');
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET) as UserPayload;

    // 4. Gán user đã verify vào request để Controller phía sau sử dụng
    // Dùng (req as any) để bypass kiểm tra type mặc định của Express
    (req as any).user = verified;

    // 5. Cho phép đi tiếp đến Controller (hoặc middleware tiếp theo)
    next();
  } catch (err) {
    res.status(403).json({ success: false, message: 'Invalid Token' });
  }
};
