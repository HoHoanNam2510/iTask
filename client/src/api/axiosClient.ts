import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api', // URL gốc của API
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor (Bộ chặn): Chạy TRƯỚC khi request được gửi đi
axiosClient.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage
    const token = localStorage.getItem('token');

    // Nếu có token, gắn vào Header: Authorization: Bearer <token>
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor: Chạy SAU khi nhận phản hồi (tùy chọn)
// Ví dụ: Nếu token hết hạn (lỗi 401), tự động đá ra trang login
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token hết hạn hoặc không hợp lệ -> Xóa token và logout
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
