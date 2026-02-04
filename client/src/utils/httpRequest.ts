/* client/src/utils/httpRequest.ts */
import axios from 'axios';

// 👇 Vite sẽ tự động lấy biến môi trường
// - Local: http://localhost:5000 (nếu bạn set trong .env local hoặc fallback ở dưới)
// - Vercel: https://itask-backend.onrender.com (do bạn set trên dashboard Vercel)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const httpRequest = axios.create({
  baseURL: API_URL,
  withCredentials: true, // QUAN TRỌNG: Để gửi cookie/token
  headers: {
    'Content-Type': 'application/json',
  },
});

// (Optional) Interceptor để debug hoặc xử lý token nếu cần
httpRequest.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      'API Error:',
      error?.response?.data?.message || error.message
    );
    return Promise.reject(error);
  }
);

export const get = async (path: string, options = {}) => {
  const response = await httpRequest.get(path, options);
  return response.data;
};

export const post = async (path: string, data = {}, options = {}) => {
  const response = await httpRequest.post(path, data, options);
  return response.data;
};

export const put = async (path: string, data = {}, options = {}) => {
  const response = await httpRequest.put(path, data, options);
  return response.data;
};

export const del = async (path: string, options = {}) => {
  const response = await httpRequest.delete(path, options);
  return response.data;
};

export default httpRequest;
