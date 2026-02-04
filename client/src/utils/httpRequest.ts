/* client/src/utils/httpRequest.ts */
import axios from 'axios';

// Tạo instance axios với cấu hình mặc định
const httpRequest = axios.create({
  // 👇 Vite sẽ thay thế import.meta.env.VITE_API_URL bằng giá trị thật khi build
  // Khi chạy local: http://localhost:5000
  // Khi deploy: https://your-backend.onrender.com
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',

  // Quan trọng: Gửi kèm cookie/token trong mọi request
  withCredentials: true,

  headers: {
    'Content-Type': 'application/json',
  },
});

// Có thể thêm interceptors ở đây nếu cần xử lý token tự động
// httpRequest.interceptors.request.use(...)

export default httpRequest;
