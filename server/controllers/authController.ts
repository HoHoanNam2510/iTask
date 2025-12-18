import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// Đăng ký
export const register = async (req: Request, res: Response): Promise<void> => {
  console.log('✅ Đã vào Controller Register!');

  try {
    const { name, username, email, password } = req.body;
    const finalUsername = username || name;

    if (!finalUsername || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Thiếu thông tin (name, email, password)',
      });
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
      role: 'user', // Mặc định là user
    });

    await newUser.save();

    console.log('🎉 Đăng ký thành công!');
    res.status(201).json({ success: true, message: 'Đăng ký thành công' });
  } catch (error: any) {
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
    console.log('👉 [DEBUG] Đang đăng nhập với email:', email);

    const user = await User.findOne({ email });

    if (!user) {
      res
        .status(400)
        .json({ success: false, message: 'Sai email hoặc mật khẩu' });
      return;
    }

    // 👇 [DEBUG 1] In ra user tìm được từ DB xem có field role không
    // toObject() giúp in ra object thuần của JS thay vì Mongoose Document
    console.log('👉 [DEBUG] User tìm thấy từ DB:', user.toObject());
    console.log('👉 [DEBUG] Role của user này là:', user.role);

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

    // 👇 [MỚI] Thêm role vào Token
    // Thêm role vào Token (để middleware sau này dùng)
    const token = jwt.sign(
      { _id: user._id, email: user.email, role: user.role }, // 👈 Thêm role vào đây
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // 👇 [DEBUG 2] In ra dữ liệu trước khi gửi về Client
    const responseData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role, // <-- Đây là cái chúng ta cần
    };
    console.log('👉 [DEBUG] Dữ liệu trả về Client:', responseData);

    res.json({
      success: true,
      token,
      user: responseData,
    });
  } catch (error) {
    console.error('❌ LOGIN ERROR:', error);
    res
      .status(500)
      .json({ success: false, message: 'Lỗi server khi đăng nhập' });
  }
};
