/* client/src/utils/imageHelper.ts */

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
  const cleanPath = imagePath.replace(/\\/g, '/');
  const normalizedPath = cleanPath.startsWith('/')
    ? cleanPath.substring(1)
    : cleanPath;

  return `http://localhost:5000/${normalizedPath}`;
};

/**
 * 👇 [MỚI] Hàm xử lý đường dẫn để TẢI VỀ (Force Download)
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
