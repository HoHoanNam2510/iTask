/* server/controllers/userController.ts */
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import cloudinary from '../config/cloudinary';

// Helper: Xóa ảnh trên Cloudinary
const deleteCloudImage = async (fileUrl: string) => {
  if (!fileUrl || !fileUrl.includes('cloudinary')) return;
  try {
    // URL mẫu: .../iTask_Uploads/avatar-123.jpg
    const splitUrl = fileUrl.split('/');
    const folderIndex = splitUrl.findIndex((part) => part === 'iTask_Uploads');

    if (folderIndex !== -1) {
      // Lấy public_id (bao gồm folder và tên file)
      const publicIdWithExt = splitUrl.slice(folderIndex).join('/');
      // Remove extension (đuôi file) để destroy được ảnh
      const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error('Lỗi xóa ảnh cũ trên Cloud:', error);
  }
};

export const updateUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    const { name } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    user.username = name || user.username;

    // Xử lý upload avatar mới
    const file = req.file;
    if (file) {
      // Xóa ảnh cũ nếu có
      if (user.avatar) {
        await deleteCloudImage(user.avatar);
      }
      user.avatar = file.path; // Lưu URL Cloudinary
    }

    await user.save();

    res.json({
      success: true,
      message: 'Cập nhật thành công',
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
    res.status(500).json({ success: false, message: 'Lỗi server khi update' });
  }
};

export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId).select('+password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // 👇 [FIXED] Thêm "|| ''" để đảm bảo luôn là string, tránh lỗi TypeScript
    const isMatch = await bcrypt.compare(currentPassword, user.password || '');

    if (!isMatch) {
      res
        .status(400)
        .json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

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

// Admin Update User (Role/Name)
export const updateUserAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { username, role } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (username) user.username = username;
    if (role) user.role = role;

    await user.save();
    res.json({ success: true, message: 'Cập nhật user thành công', user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Hàm cũ (giữ lại để tránh lỗi import ở routes nếu có dùng)
export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Hàm lấy danh sách Users cho Admin (Phân trang + Search)
export const getAllUsersAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const order = (req.query.order as string) || 'desc';

    const skip = (page - 1) * limit;

    // Query tìm kiếm
    const query: any = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOption: any = { [sortBy]: order === 'asc' ? 1 : -1 };

    const users = await User.find(query)
      .select('-password -badges') // Không lấy password và badges để nhẹ
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments(query);

    res.json({
      success: true,
      total: totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      users,
    });
  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi lấy danh sách user' });
  }
};
