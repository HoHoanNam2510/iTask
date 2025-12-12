import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import groupRoutes from './routes/groupRoutes';
import categoryRoutes from './routes/categoryRoutes';
import feedbackRoutes from './routes/feedbackRoutes';

dotenv.config();
connectDB(); // Kết nối DB

const app = express();

app.use(cors());
app.use(express.json()); // Để đọc JSON từ body
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // Public folder ảnh

// --- ROUTES ---
app.use('/api/auth', authRoutes); // Login, Register
app.use('/api/tasks', taskRoutes); // Tasks (CRUD)
app.use('/api/groups', groupRoutes); // Groups & Members
app.use('/api/categories', categoryRoutes); // Categories
app.use('/api/feedbacks', feedbackRoutes); // Feedbacks

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
