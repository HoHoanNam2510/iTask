import express from 'express';
import cors from 'cors';
import path from 'path';
import taskRoutes from './routes/taskRoutes';
// ... các import khác

const app = express();

app.use(cors());
app.use(express.json());

// ĐỊNH NGHĨA API ROUTE TẠI ĐÂY
// Nghĩa là: Mọi request bắt đầu bằng /api/tasks sẽ đi vào taskRoutes xử lý
app.use('/api/tasks', taskRoutes);
// --- QUAN TRỌNG: Mở quyền truy cập thư mục uploads ---
// Khi user truy cập /uploads/abc.jpg -> server sẽ tìm trong thư mục uploads/abc.jpg
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // Cần trỏ đúng đường dẫn tùy cấu trúc folder của bạn

// ... các routes khác
