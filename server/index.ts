/* server/index.ts */
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import fs from 'fs';
import cors from 'cors';
import path from 'path';
import cron from 'node-cron';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { ExpressPeerServer } from 'peer';

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

import { socketHandler } from './socket';
import Task from './models/Task';
import { auditLogger } from './middleware/auditMiddleware';

const app = express();
const httpServer = http.createServer(app);

// 2. KẾT NỐI DB
connectDB();

// 👇 [FIXED] Cấu hình CORS chặt chẽ hơn để hỗ trợ credentials
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: allowedOrigins, // Chỉ cho phép client cụ thể
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, // Cho phép gửi cookie/token
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsPath = path.join(process.cwd(), '../uploads');

// 4. LOGGER
app.use((req, res, next) => {
  if (!req.url.includes('socket.io')) {
    console.log(`\n👉 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
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

// 👇 [FIXED] CẤU HÌNH SOCKET.IO CORS ĐỒNG BỘ
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins, // Phải khớp với Express CORS
    methods: ['GET', 'POST'],
    credentials: true, // Quan trọng: Cho phép client gửi credentials
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
});
socketHandler(io);

// 👇 CẤU HÌNH PEER SERVER
const peerServer = ExpressPeerServer(httpServer, {
  path: '/myapp',
});
app.use('/peerjs', peerServer);

// [CRON JOB] Dọn dẹp thùng rác
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
        if (task.image && !task.image.startsWith('http')) {
          try {
            fs.unlinkSync(path.join(process.cwd(), '../', task.image));
          } catch (e) {}
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

httpServer.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT} (Socket & Peer ready)`)
);
