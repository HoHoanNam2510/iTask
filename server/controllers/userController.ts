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

// ==========================================
// EMAIL HELPER FUNCTION (Cấu hình chuẩn Production)
// ==========================================
const sendEmail = async (options: {
  email: string;
  subject: string;
  message: string;
}) => {
  // 1. Sanitize & Parse Environment Variables
  const host = (process.env.EMAIL_HOST || 'smtp.gmail.com').trim();
  const port = parseInt(process.env.EMAIL_PORT || '587', 10); // Ép kiểu số
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').trim();

  // Log debug để xem Server nhận biến môi trường ra sao (Che mật khẩu)
  console.log('📧 [SMTP DEBUG] Configuration:', {
    host,
    port,
    user: user ? `${user.substring(0, 3)}***@***` : 'MISSING',
    pass: pass ? '****** (OK)' : 'MISSING',
    secure: port === 465,
  });

  if (!user || !pass) {
    throw new Error('Thiếu cấu hình EMAIL_USER hoặc EMAIL_PASS');
  }

  // 2. Create Transporter
  // Dùng 'as any' để tránh lỗi TypeScript checking property 'host'
  const transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user: user,
      pass: pass,
    },
    tls: {
      // Quan trọng cho Render/Vercel: Chấp nhận chứng chỉ self-signed nếu cần
      rejectUnauthorized: false,
    },
    // Ép buộc dùng IPv4 để tránh lỗi network trên một số cloud provider
    family: 4,
  } as any);

  const mailOptions = {
    from: `"iTask Support" <${user}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  // 3. Verify Connection & Send
  try {
    // Kiểm tra kết nối trước
    await transporter.verify();
    console.log('✅ SMTP Connection Verified');

    // Gửi mail
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${options.email}`);
  } catch (err) {
    console.error('❌ SMTP Error Detail:', err);
    throw err; // Ném lỗi ra để Controller xử lý
  }
};

// ==========================================
// USER CONTROLLERS
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
// ADMIN CONTROLLERS
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

    // 1. Tạo Token & Expiry
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
    await user.save();

    // 2. Tạo Link Reset
    const clientUrl = (
      process.env.CLIENT_URL || 'http://localhost:5173'
    ).replace(/\/$/, '');
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    console.log(`🔗 Link Reset generated: ${resetUrl}`);

    // 3. Nội dung Email
    const message = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #40a578;">Đặt lại mật khẩu iTask</h2>
        <p>Xin chào <strong>${user.username}</strong>,</p>
        <p>Bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản này.</p>
        <p>Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu (Link hết hạn sau 10 phút):</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #40a578; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Đặt Lại Mật Khẩu</a>
        </div>
        <p>Hoặc copy link này: ${resetUrl}</p>
      </div>
    `;

    // 4. Gửi Email
    try {
      await sendEmail({
        email: user.email,
        subject: 'iTask - Yêu cầu đặt lại mật khẩu',
        message,
      });

      res.json({ success: true, message: 'Email đã được gửi thành công.' });
    } catch (err: any) {
      // Rollback DB nếu gửi mail lỗi
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      // Trả lỗi chi tiết để Frontend hiển thị (hoặc debug)
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

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Link không hợp lệ hoặc đã hết hạn.',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Clear token
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
