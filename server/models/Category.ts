import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description?: string; // <-- Bổ sung trường này
  color?: string;
  createdBy: mongoose.Types.ObjectId; // User tạo ra category này
}

const CategorySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Bổ sung vào Schema
    description: {
      type: String,
      default: '', // Mặc định là chuỗi rỗng nếu người dùng không nhập
      trim: true,
    },
    color: {
      type: String,
      default: '#40a578', // Màu xanh mặc định của App
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Đảm bảo 1 user không tạo 2 category trùng tên để tránh nhầm lẫn
CategorySchema.index({ name: 1, createdBy: 1 }, { unique: true });

export default mongoose.model<ICategory>('Category', CategorySchema);
