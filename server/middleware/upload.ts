/* server/middleware/upload.ts */
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';

// 1. Cấu hình nơi lưu trữ (Cloudinary Storage)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'iTask_Uploads', // Tên thư mục trên Cloudinary
      resource_type: 'auto', // Tự động nhận diện (image/raw/video)
      public_id: file.fieldname + '-' + Date.now(), // Tên file unique
      // allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'pdf', 'docx', 'txt'], // Tuỳ chọn
    };
  },
});

// 2. Bộ lọc file (Giữ nguyên logic cũ)
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedMimeTypes = [
    // Ảnh
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/gif',
    'image/webp',
    // Tài liệu văn phòng
    'application/pdf', // .pdf
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/plain', // .txt
    // File nén
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/octet-stream',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Định dạng file không được hỗ trợ! (Chỉ chấp nhận Ảnh, PDF, Word, Excel, Zip, Txt)'
      ) as any,
      false
    );
  }
};

// 3. Khởi tạo Multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: fileFilter,
});

export default upload;
