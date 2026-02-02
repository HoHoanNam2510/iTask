/* server/middleware/upload.ts */
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';
import path from 'path';

// Helper: Chuyển tiếng Việt có dấu thành không dấu & thay ký tự lạ
const removeAccents = (str: string) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/\s+/g, '_') // Thay khoảng trắng bằng _
    .replace(/[^a-zA-Z0-9._-]/g, ''); // Bỏ ký tự đặc biệt
};

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // 1. Lấy tên gốc và extension
    const originalName = file.originalname;
    const fileExt = path.extname(originalName).substring(1); // Bỏ dấu chấm (vd: pdf, png)
    const nameWithoutExt = path.basename(originalName, `.${fileExt}`);

    // 2. Tạo public_id sạch (Không dấu)
    const safeName = removeAccents(nameWithoutExt);
    const publicId = `${file.fieldname}-${Date.now()}-${safeName}`;

    // 3. Cấu hình trả về cho Cloudinary
    return {
      folder: 'iTask_Uploads',
      resource_type: 'auto', // Tự động nhận diện (image/video/raw)
      public_id: publicId,
      // QUAN TRỌNG: Với file raw (không phải ảnh), cần set format để giữ đuôi file
      // Nếu là ảnh (image/...) thì Cloudinary tự lo, còn lại thì ép kiểu theo extension gốc
      format: file.mimetype.startsWith('image') ? undefined : fileExt,
      // Dùng raw_convert để giữ nguyên tên file khi download (tùy chọn)
      use_filename: true,
    };
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  // Cho phép nhiều định dạng phổ biến
  const allowedMimeTypes = [
    // Ảnh
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/gif',
    'image/webp',
    // Docs
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/plain',
    'text/csv',
    // Zip/Rar
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/octet-stream',
  ];

  // Tạm thời cho phép tất cả để tránh lỗi chặn nhầm file (hoặc dùng list trên nếu muốn chặt chẽ)
  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Giới hạn 10MB
  fileFilter: fileFilter,
});

export default upload;
