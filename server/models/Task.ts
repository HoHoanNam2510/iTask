import mongoose, { Schema, Document } from 'mongoose';

// 1. Định nghĩa Interface cho TypeScript (giúp code gợi ý lệnh chính xác)
export interface ITask extends Document {
  title: string;
  description?: string;
  image?: string; // URL của ảnh upload
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'moderate' | 'extreme'; // Khớp với UI: Low, Moderate, Extreme
  dueDate: Date;

  // Quan hệ dữ liệu (Relations)
  category?: mongoose.Types.ObjectId; // Optional

  // Logic phân biệt Personal/Group
  creator: mongoose.Types.ObjectId; // Người tạo task (luôn luôn có)
  assignee?: mongoose.Types.ObjectId; // Người được giao việc (Optional nếu là Personal)
  group?: mongoose.Types.ObjectId; // Nếu null -> Personal Task. Có ID -> Group Task.

  createdAt: Date;
  updatedAt: Date;
}

// 2. Định nghĩa Schema cho Mongoose
const TaskSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '', // Lưu URL ảnh (VD: /uploads/task-123.jpg)
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'completed'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'moderate', 'extreme'], // Khớp với checkbox UI
      default: 'moderate',
    },
    dueDate: {
      type: Date,
      required: true,
    },

    // --- RELATIONS ---
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },

    // Người tạo ra task này (User đang login)
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Người thực hiện:
    // - Nếu Personal: Thường backend tự gán = creator
    // - Nếu Group: Chọn từ list member
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Điểm quyết định Personal hay Group Task
    group: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      default: null, // Mặc định null là Personal Task
    },
  },
  {
    timestamps: true, // Tự động tạo createdAt, updatedAt
  }
);

// Tối ưu Query: Tạo index để tìm kiếm nhanh hơn
TaskSchema.index({ creator: 1, status: 1 }); // Tìm task của tôi theo trạng thái
TaskSchema.index({ group: 1 }); // Tìm task của một nhóm

export default mongoose.model<ITask>('Task', TaskSchema);
