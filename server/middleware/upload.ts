import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express'; // Import type Request của Express
import path from 'path';
import fs from 'fs';

// 1. Cấu hình nơi lưu trữ (DiskStorage)
const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    const uploadPath = path.join(__dirname, '../../uploads'); // Lưu ý đường dẫn tương đối

    // Kiểm tra nếu thư mục chưa tồn tại thì tạo mới
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
    // Tạo tên file unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
  },
});

// 2. Bộ lọc file (Chỉ chấp nhận ảnh)
// Sử dụng type chuẩn: Request, Express.Multer.File, FileFilterCallback
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg'
  ) {
    cb(null, true);
  } else {
    // Ép kiểu Error để TS không báo lỗi
    cb(
      new Error(
        'Sai định dạng! Chỉ chấp nhận file ảnh (jpg, jpeg, png).'
      ) as any,
      false
    );
  }
};

// 3. Khởi tạo Multer upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // Giới hạn 5MB
  },
  fileFilter: fileFilter,
});

export default upload;
