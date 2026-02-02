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

    // 1. Xử lý Avatar mới
    if (req.file) {
      // Nếu user đang có avatar cũ trên Cloud -> Xóa đi
      if (user.avatar && user.avatar.includes('cloudinary')) {
        await deleteCloudImage(user.avatar);
      }
      // Lưu URL mới (đã là link https://res.cloudinary...)
      user.avatar = req.file.path;
    }

    if (name) user.username = name;

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

// 👇 [UPDATED] Lấy tất cả user (Admin) - Có Pagination, Search, Sort
export const getAllUsers = async (
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

    // Filter query: Tìm theo username HOẶC email
    const query: any = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Sort option
    const sortValue = order === 'asc' ? 1 : -1;
    const sortOption: any = { [sortBy]: sortValue };

    const users = await User.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      total: totalUsers,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      users,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: 'Lỗi server khi lấy danh sách user' });
  }
};

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
    const user = await User.findById(userId);
    if (!user || !user.password) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
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

// 👇 [THÊM MỚI] Admin Update User (Role/Name)
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
    if (role && (role === 'admin' || role === 'user')) user.role = role;

    await user.save();
    res.json({ success: true, message: 'Cập nhật user thành công', user });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Lỗi server khi update user' });
  }
};
