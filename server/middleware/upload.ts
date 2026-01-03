/* server/middleware/upload.ts */
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';

// 1. Cấu hình nơi lưu trữ (DiskStorage)
const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    // Đảm bảo đường dẫn này trỏ đúng về thư mục uploads ở root server
    // Nếu file này nằm trong server/middleware/ thì ../../uploads là ra root/uploads
    const uploadPath = path.join(__dirname, '../../uploads');

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    // Tạo tên file unique tránh trùng lặp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // Giữ nguyên đuôi file gốc (.pdf, .png, .docx...)
    const fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
  },
});

// 2. Bộ lọc file (Mở rộng cho phép file văn phòng)
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
    'application/octet-stream', // Một số file zip/rar nhận diện là octet-stream
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Ép kiểu Error để TS không báo lỗi
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
    fileSize: 10 * 1024 * 1024, // Tăng lên 10MB cho thoải mái
  },
  fileFilter: fileFilter,
});

export default upload;
