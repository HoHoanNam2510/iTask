import dotenv from 'dotenv';
dotenv.config(); // 1. Load env đầu tiên

import express from 'express';
import cors from 'cors';
import path from 'path';

// Import các file nội bộ
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import groupRoutes from './routes/groupRoutes';
import categoryRoutes from './routes/categoryRoutes';
import feedbackRoutes from './routes/feedbackRoutes';

const app = express();

// 2. KẾT NỐI DB
connectDB();

// 3. MIDDLEWARE (BẮT BUỘC PHẢI Ở ĐÂY)
app.use(cors());
app.use(express.json()); // Để đọc được req.body
app.use(express.urlencoded({ extended: true }));

// 4. LOGGER CỰC MẠNH (Để debug)
app.use((req, res, next) => {
  console.log(`\n👉 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('   📦 Body:', JSON.stringify(req.body, null, 2));
  next();
});

// 5. STATIC FILES
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 6. ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/feedbacks', feedbackRoutes);

// 7. GLOBAL ERROR HANDLER (Chặn lỗi crash app)
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
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
