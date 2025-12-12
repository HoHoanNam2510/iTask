import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// Đăng ký
export const register = async (req: Request, res: Response): Promise<void> => {
  // 👇 LOG CHECK 1: Xem hàm này có được gọi không
  console.log('✅ Đã vào Controller Register!');

  try {
    const { name, username, email, password } = req.body;

    // Mapping: Nếu frontend gửi 'name', ta gán nó vào 'username' của Backend
    const finalUsername = username || name;

    // Log kiểm tra dữ liệu
    console.log('📦 Dữ liệu nhận được:', { finalUsername, email, password });

    if (!finalUsername || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Thiếu thông tin (name, email, password)',
      });
      return;
    }

    // Check trùng email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Email đã tồn tại' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username: finalUsername, // Map vào đúng trường username trong User.ts
      email,
      password: hashedPassword,
    });

    await newUser.save();

    console.log('🎉 Đăng ký thành công!');
    res.status(201).json({ success: true, message: 'Đăng ký thành công' });
  } catch (error: any) {
    // 👇 LOG CHECK 2: Nếu lỗi, nó PHẢI hiện ở đây
    console.error('❌ LỖI TRONG CATCH:', error);
    res
      .status(500)
      .json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// Đăng nhập
export const login = async (req: Request, res: Response): Promise<void> => {
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

    if (!process.env.JWT_SECRET) {
      throw new Error('Chưa cấu hình JWT_SECRET trong file .env');
    }

    // Tạo token
    const token = jwt.sign(
      { _id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    // ✅ LOG LỖI RA TERMINAL
    console.error('❌ LOGIN ERROR:', error);
    res
      .status(500)
      .json({ success: false, message: 'Lỗi server khi đăng nhập' });
  }
};
