/* client/src/utils/imageHelper.ts */

// 👇 Lấy URL Backend từ biến môi trường (Vite tự động inject)
// Nếu chạy local (chưa set env) thì fallback về http://localhost:5000
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Hàm xử lý đường dẫn ảnh/file để hiển thị (Preview)
 */
export const getImageUrl = (imagePath?: string | null): string => {
  if (!imagePath) return '';

  // 1. Link tuyệt đối (Cloudinary, External) hoặc Blob (Preview)
  if (
    imagePath.startsWith('http') ||
    imagePath.startsWith('https') ||
    imagePath.startsWith('blob:')
  ) {
    return imagePath;
  }

  // 2. Link Local (Legacy support)
  // Xử lý dấu gạch chéo ngược (Windows path) thành gạch chéo xuôi
  const cleanPath = imagePath.replace(/\\/g, '/');

  // Đảm bảo không bị double slash (//)
  const normalizedPath = cleanPath.startsWith('/')
    ? cleanPath.substring(1)
    : cleanPath;

  // Sử dụng API_URL động thay vì cứng
  return `${API_URL}/${normalizedPath}`;
};

/**
 * Hàm xử lý đường dẫn để TẢI VỀ (Force Download)
 * Tự động thêm flag 'fl_attachment' vào URL Cloudinary
 */
export const getDownloadUrl = (imagePath?: string | null): string => {
  const url = getImageUrl(imagePath);

  // Nếu là link Cloudinary, chèn flag fl_attachment vào sau /upload/
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/fl_attachment/');
  }

  return url;
};
