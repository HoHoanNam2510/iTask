/* server/index.ts */
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import fs from 'fs';
import cors from 'cors';
import path from 'path';
import cron from 'node-cron';
// Đã xóa http, socket.io, peer

// Import các file nội bộ
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import groupRoutes from './routes/groupRoutes';
import systemRoutes from './routes/systemRoutes';
import commentRoutes from './routes/commentRoutes';
import categoryRoutes from './routes/categoryRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import notificationRoutes from './routes/notificationRoutes';

import Task from './models/Task';
import { auditLogger } from './middleware/auditMiddleware';
import cloudinary from './config/cloudinary'; // Import cloudinary để xóa trên cloud nếu cần

const app = express();

// 2. KẾT NỐI DB
connectDB();

// 3. CẤU HÌNH CORS (QUAN TRỌNG CHO DEPLOY)
// allowedOrigins bao gồm:
// - Localhost frontend (để bạn code ở máy)
// - Biến CLIENT_URL (để sau này điền domain Vercel vào cấu hình trên Render)
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL || '', // URL Frontend sau khi deploy
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép request không có origin (như Postman, Mobile App, hoặc server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('Blocked by CORS:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, // Cho phép gửi cookie/token
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. LOGGER
app.use((req, res, next) => {
  console.log(`\n👉 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 5. STATIC FILES (Giữ lại để support ảnh cũ chưa migrate, ảnh mới sẽ dùng link cloudinary)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Audit Logger
app.use('/api', auditLogger);

// 6. ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

// [CRON JOB] Dọn dẹp thùng rác (Đã update để handle Cloudinary)
cron.schedule('0 0 * * *', async () => {
  console.log('⏰ [CRON] Bắt đầu quét dọn thùng rác...');
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  try {
    const tasksToDelete = await Task.find({
      isDeleted: true,
      deletedAt: { $lt: thirtyDaysAgo },
    });
    if (tasksToDelete.length > 0) {
      console.log(`🗑️ Tìm thấy ${tasksToDelete.length} tasks hết hạn.`);
      for (const task of tasksToDelete) {
        // Xóa ảnh bìa
        if (task.image) {
          if (task.image.includes('cloudinary')) {
            // Logic xóa cloud (copy từ controller nếu cần hoặc skip ở cron)
            // Tốt nhất là xóa luôn lúc permanentDeleteTask, Cron này chỉ là backup
          } else if (!task.image.startsWith('http')) {
            // Xóa ảnh local cũ
            try {
              fs.unlinkSync(path.join(process.cwd(), '../', task.image));
            } catch (e) {}
          }
        }
        await Task.findByIdAndDelete(task._id);
      }
      console.log('✅ Dọn dẹp hoàn tất.');
    }
  } catch (error) {
    console.error('❌ Lỗi Cronjob:', error);
  }
});

// 7. ERROR HANDLER
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('🔥 SERVER ERROR:', err.stack);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: err.message,
    });
  }
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT} (Clean Express Mode)`)
);
