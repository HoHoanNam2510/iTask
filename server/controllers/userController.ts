import { Request, Response } from 'express';
import User from '../models/User';

// [PUT] /api/users/profile
export const updateUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // 1. Lấy ID user từ token (được middleware verifyToken gán vào req.user)
    const userId = (req as any).user._id;

    // 2. Lấy dữ liệu từ client gửi lên
    // Frontend gửi 'name', nhưng DB của bạn tên là 'username' -> Cần map lại
    const { name } = req.body;
    let avatarPath = '';

    // 3. Xử lý file ảnh (Avatar)
    if (req.file) {
      avatarPath = `uploads/${req.file.filename}`;
    }

    // 4. Tìm User trong DB
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // 5. Cập nhật thông tin
    if (name) user.username = name; // Map 'name' từ form vào 'username' của Model
    if (avatarPath) user.avatar = avatarPath;

    // 6. Lưu vào DB
    await user.save();

    // 7. Trả về kết quả (Trả về user mới để Frontend update Context)
    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      user: {
        _id: user._id,
        name: user.username, // Trả về 'name' để khớp với interface frontend
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Lỗi server khi cập nhật profile' });
  }
};
