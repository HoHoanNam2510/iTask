/* server/controllers/authController.ts */
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import sendEmail from '../utils/sendEmail';

// ... (Các hàm register, login giữ nguyên) ...
export const register = async (req: Request, res: Response): Promise<void> => {
  // ... (Code cũ giữ nguyên)
  console.log('✅ Đã vào Controller Register!');
  try {
    const { name, username, email, password } = req.body;
    const finalUsername = username || name;
    if (!finalUsername || !email || !password) {
      res.status(400).json({ success: false, message: 'Thiếu thông tin' });
      return;
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Email đã tồn tại' });
      return;
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      username: finalUsername,
      email,
      password: hashedPassword,
      role: 'user',
    });
    await newUser.save();
    res.status(201).json({ success: true, message: 'Đăng ký thành công' });
  } catch (error: any) {
    res
      .status(500)
      .json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  // ... (Code cũ giữ nguyên)
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res
        .status(400)
        .json({ success: false, message: 'Sai email hoặc mật khẩu' });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      res
        .status(400)
        .json({ success: false, message: 'Sai email hoặc mật khẩu' });
      return;
    }
    if (!process.env.JWT_SECRET) throw new Error('Chưa cấu hình JWT_SECRET');
    const token = jwt.sign(
      { _id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    const responseData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
    };
    res.json({ success: true, token, user: responseData });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Lỗi server khi đăng nhập' });
  }
};

// --- PHẦN QUÊN MẬT KHẨU ---
// 1. Gửi yêu cầu (Forgot Password)
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ success: false, message: 'Email không tồn tại' });
      return;
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    await user.save();

    // 👇 [FIX] Đổi port thành 5173 (Port của Frontend Vite)
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    const message = `
      <h1>Bạn đã yêu cầu khôi phục mật khẩu</h1>
      <p>Vui lòng click vào đường dẫn bên dưới để đặt lại mật khẩu mới:</p>
      <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
      <p>Đường dẫn này sẽ hết hạn sau 10 phút.</p>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'iTask - Khôi phục mật khẩu',
        message: `Link reset: ${resetUrl}`,
        html: message,
      });

      res.json({ success: true, message: 'Đã gửi email khôi phục.' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      res.status(500).json({ success: false, message: 'Gửi email thất bại' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// 2. Đặt lại mật khẩu (Reset Password) - 👇 [MỚI]
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Token được gửi qua URL params (/:resetToken)
    const { resetToken } = req.params;
    const { password } = req.body;

    // Tìm user có token trùng khớp và chưa hết hạn ($gt: lớn hơn thời điểm hiện tại)
    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn',
      });
      return;
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Xóa token sau khi dùng xong
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.',
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
