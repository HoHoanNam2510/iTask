/* server/controllers/userController.ts */
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import User from '../models/User';
import cloudinary from '../config/cloudinary';

// Helper: Xóa ảnh trên Cloudinary
const deleteCloudImage = async (fileUrl: string) => {
  if (!fileUrl || !fileUrl.includes('cloudinary')) return;
  try {
    const splitUrl = fileUrl.split('/');
    const folderIndex = splitUrl.findIndex((part) => part === 'iTask_Uploads');
    if (folderIndex !== -1) {
      const publicIdWithExt = splitUrl.slice(folderIndex).join('/');
      const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error('Lỗi xóa ảnh cũ trên Cloud:', error);
  }
};

// Helper: Gửi Email (Cấu hình chuẩn cho Port 587 & 465)
const sendEmail = async (options: {
  email: string;
  subject: string;
  message: string;
}) => {
  // 1. Lấy config từ Env
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  // Mặc định fallback về 587 nếu không tìm thấy biến môi trường
  const port = Number(process.env.EMAIL_PORT) || 587;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error('Thiếu cấu hình EMAIL_USER hoặc EMAIL_PASS trong .env');
  }

  console.log(`📧 Đang kết nối SMTP: ${host}:${port} (User: ${user})`);

  // 2. Cấu hình Transporter
  // 👇 [FIXED] Thêm "as any" để tránh lỗi TypeScript checking
  const transporter = nodemailer.createTransport({
    host: host,
    port: port,
    // - Port 465: secure = true (SSL)
    // - Port 587: secure = false (STARTTLS - Nodemailer tự động upgrade)
    secure: port === 465,
    auth: {
      user: user,
      pass: pass,
    },
    // Fix lỗi chứng chỉ SSL trên Render/Vercel (Self-signed certs)
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3',
    },
    family: 4, // Ép buộc dùng IPv4 để tránh lỗi Network trên Cloud
  } as any);

  const mailOptions = {
    from: `"iTask Support" <${user}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  // Verify kết nối trước khi gửi (Debug lỗi connection)
  await transporter.verify().catch((err) => {
    console.error('❌ Lỗi kết nối SMTP:', err);
    throw err;
  });

  await transporter.sendMail(mailOptions);
  console.log('✅ Email sent successfully');
};

// ==========================================
// CÁC HÀM QUẢN LÝ USER (USER PROFILE & PASSWORD)
// ==========================================

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

    const file = req.file;
    if (file) {
      if (user.avatar) {
        await deleteCloudImage(user.avatar);
      }
      user.avatar = file.path;
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

// ==========================================
// CÁC HÀM QUẢN LÝ USER (ADMIN)
// ==========================================

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

    const query: any = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOption: any = { [sortBy]: order === 'asc' ? 1 : -1 };

    const users = await User.find(query)
      .select('-password -badges')
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

// ==========================================
// FORGOT & RESET PASSWORD LOGIC
// ==========================================

export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Email không tồn tại trong hệ thống',
      });
      return;
    }

    // 1. Tạo Token ngẫu nhiên
    const resetToken = crypto.randomBytes(20).toString('hex');

    // 2. Lưu vào DB (10 phút hết hạn)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // 3. Tạo URL Reset Password
    // Lấy Client URL từ biến môi trường, fallback về localhost cho dev
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    // Đảm bảo không bị double slash (ví dụ: clientUrl kết thúc bằng /)
    const cleanClientUrl = clientUrl.replace(/\/$/, '');
    const resetUrl = `${cleanClientUrl}/reset-password/${resetToken}`;

    console.log(`🔗 Link Reset Link (Server Generated): ${resetUrl}`);

    // 4. Nội dung Email HTML
    const message = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
        <h2 style="color: #40a578; text-align: center;">Yêu Cầu Đặt Lại Mật Khẩu</h2>
        <p>Xin chào <strong>${user.username}</strong>,</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản iTask của bạn.</p>
        <p style="text-align: center;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #40a578; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Đặt Lại Mật Khẩu Ngay</a>
        </p>
        <p>⚠️ Link này sẽ hết hạn sau <strong>10 phút</strong>.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="font-size: 13px; color: #666;">Nếu nút trên không hoạt động, hãy copy đường dẫn sau vào trình duyệt:</p>
        <p style="font-size: 12px; color: #007bff; word-break: break-all;">${resetUrl}</p>
        <p style="font-size: 12px; color: #999; margin-top: 10px;">Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'iTask - Hướng dẫn đặt lại mật khẩu',
        message,
      });

      res.json({ success: true, message: 'Email đã được gửi thành công.' });
    } catch (err: any) {
      // Rollback nếu gửi mail thất bại để user có thể thử lại ngay
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      console.error('❌ Send Email FAILED:', err);

      // Trả về thông báo lỗi chi tiết hơn nếu ở môi trường Dev
      res.status(500).json({
        success: false,
        message: 'Lỗi kết nối SMTP. Vui lòng kiểm tra server mail.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  } catch (error) {
    console.error('Forgot Password Controller Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Tìm user có token khớp và thời gian chưa hết hạn
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
      });
      return;
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Xóa token để không dùng lại được
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.',
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
