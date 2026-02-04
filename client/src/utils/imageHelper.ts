/* client/src/utils/imageHelper.ts */

// Lấy URL Backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const getImageUrl = (imagePath?: string | null): string => {
  if (!imagePath) return '';

  // 1. Link tuyệt đối (Cloudinary, External)
  if (
    imagePath.startsWith('http') ||
    imagePath.startsWith('https') ||
    imagePath.startsWith('blob:')
  ) {
    return imagePath;
  }

  // 2. Link Local (Legacy) -> Nối với API_URL động
  const cleanPath = imagePath.replace(/\\/g, '/');
  const normalizedPath = cleanPath.startsWith('/')
    ? cleanPath.substring(1)
    : cleanPath;

  return `${API_URL}/${normalizedPath}`;
};

export const getDownloadUrl = (imagePath?: string | null): string => {
  const url = getImageUrl(imagePath);
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/fl_attachment/');
  }
  return url;
};
