import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import User from '../models/User';

// [MỚI] Hàm lấy đường dẫn file chuẩn xác
// Do uploads nằm ngang hàng với server, ta phải dùng '../' để lùi ra ngoài folder server
const getLocalImagePath = (dbPath: string) => {
  return path.join(process.cwd(), '../', dbPath);
};

// [PUT] /api/users/profile
export const updateUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user._id;

    // Log debug (Giữ nguyên của bạn)
    console.log('--- DEBUG UPDATE PROFILE ---');
    console.log('📂 req.file:', req.file);
    console.log('📝 req.body:', req.body);
    console.log('----------------------------');

    const { name } = req.body;
    let avatarPath = '';

    // 1. Tìm User TRƯỚC để lấy avatar cũ
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // 2. Nếu người dùng có upload ảnh mới
    if (req.file) {
      avatarPath = `uploads/${req.file.filename}`;

      // 👇 [LOGIC MỚI] XÓA ẢNH CŨ 👇
      if (user.avatar && !user.avatar.startsWith('http')) {
        const oldAbsolutePath = getLocalImagePath(user.avatar);

        // Kiểm tra file có tồn tại không rồi xóa
        if (fs.existsSync(oldAbsolutePath)) {
          try {
            fs.unlinkSync(oldAbsolutePath);
            console.log('🗑️ Đã xóa avatar cũ:', oldAbsolutePath);
          } catch (err) {
            console.error('❌ Lỗi không xóa được ảnh cũ:', err);
          }
        }
      }
      // 👆 [HẾT LOGIC XÓA] 👆
    }

    // 3. Cập nhật thông tin vào DB
    if (name) user.username = name;
    if (avatarPath) user.avatar = avatarPath;

    await user.save();

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Lỗi server khi cập nhật profile' });
  }
};

// 👇 [THÊM MỚI] Lấy tất cả user (Dành cho Admin)
export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Lấy tất cả user, sắp xếp mới nhất lên đầu
    // Không dùng .select('-password') vì bạn yêu cầu hiển thị chuỗi mã hóa
    const users = await User.find().sort({ createdAt: -1 });

    res.json({ success: true, users });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: 'Lỗi server khi lấy danh sách user' });
  }
};

// 👇 [THÊM MỚI] Xóa user (Dành cho Admin)
export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ success: true, message: 'Đã xóa người dùng thành công' });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Lỗi server khi xóa user' });
  }
};

// 👇 [THÊM MỚI] Hàm đổi mật khẩu
export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res
        .status(400)
        .json({ success: false, message: 'Vui lòng nhập đủ thông tin' });
      return;
    }

    // 1. Tìm user trong DB (cần lấy cả field password để so sánh)
    const user = await User.findById(userId);
    if (!user || !user.password) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // 2. Kiểm tra mật khẩu hiện tại có đúng không
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res
        .status(400)
        .json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
      return;
    }

    // 3. Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. Lưu mật khẩu mới vào DB
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Change Password Error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Lỗi server khi đổi mật khẩu' });
  }
};
