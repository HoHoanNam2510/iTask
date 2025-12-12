import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    // Lấy chuỗi kết nối từ biến môi trường
    const connStr = process.env.MONGO_URI;

    if (!connStr) {
      throw new Error('Biến MONGO_URI chưa được định nghĩa trong file .env');
    }

    // Thực hiện kết nối
    const conn = await mongoose.connect(connStr);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // Xử lý lỗi nếu không kết nối được
    if (error instanceof Error) {
      console.error(`❌ Error: ${error.message}`);
    } else {
      console.error('❌ Unknown Error while connecting to MongoDB');
    }

    // Dừng server ngay lập tức nếu lỗi DB (exit code 1)
    process.exit(1);
  }
};

export default connectDB;
