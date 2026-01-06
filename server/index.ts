/* server/index.ts */
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import fs from 'fs';
import cors from 'cors';
import path from 'path';
import cron from 'node-cron';
import http from 'http'; // 👈 [MỚI] Import HTTP
import { Server as SocketIOServer } from 'socket.io'; // 👈 [MỚI] Import Socket.io
import { ExpressPeerServer } from 'peer'; // 👈 [MỚI] Import PeerServer

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

// Import Socket Handler
import { socketHandler } from './socket';

// 👇 [FIX] Import Model Task để dùng trong Cronjob
import Task from './models/Task';

// Import Audit Middleware
import { auditLogger } from './middleware/auditMiddleware';

const app = express();
const httpServer = http.createServer(app); // 👈 [MỚI] Wrap Express app bằng HTTP Server

// 2. KẾT NỐI DB
connectDB();

// 3. MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsPath = path.join(process.cwd(), '../uploads');

// 4. LOGGER
app.use((req, res, next) => {
  console.log(`\n👉 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  // console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  next();
});

// 5. STATIC FILES
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

// 👇 [MỚI] CẤU HÌNH SOCKET.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*', // Cho phép mọi origin (hoặc set cụ thể client url)
    methods: ['GET', 'POST'],
  },
});
socketHandler(io); // Kích hoạt logic socket

// 👇 [MỚI] CẤU HÌNH PEER SERVER (Dùng cho Video Call P2P)
const peerServer = ExpressPeerServer(httpServer, {
  path: '/myapp',
});
app.use('/peerjs', peerServer);

// 👇 [CRON JOB] Dọn dẹp thùng rác lúc 00:00 mỗi ngày
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
      console.log(
        `🗑️ Tìm thấy ${tasksToDelete.length} tasks hết hạn. Đang xóa...`
      );

      for (const task of tasksToDelete) {
        if (task.image && !task.image.startsWith('http')) {
          const imagePath = path.join(process.cwd(), '../', task.image);
          if (fs.existsSync(imagePath)) {
            try {
              fs.unlinkSync(imagePath);
            } catch (e) {}
          }
        }
        await Task.findByIdAndDelete(task._id);
      }
      console.log('✅ Dọn dẹp hoàn tất.');
    } else {
      console.log('✨ Không có gì để dọn.');
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
// 👇 [SỬA] Đổi app.listen thành httpServer.listen
httpServer.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT} (Socket & Peer ready)`)
);
