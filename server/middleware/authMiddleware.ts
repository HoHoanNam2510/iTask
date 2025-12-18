import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// [CẬP NHẬT] Thêm role vào payload
interface UserPayload {
  _id: string;
  email: string;
  role: string; // Thêm dòng này
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res
      .status(401)
      .json({ success: false, message: 'Access Denied: No Token Provided' });
    return;
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in .env');
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET) as UserPayload;
    (req as any).user = verified;
    next();
  } catch (err) {
    res.status(403).json({ success: false, message: 'Invalid Token' });
  }
};
