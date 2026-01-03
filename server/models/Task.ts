/* server/models/Task.ts */
import mongoose, { Schema, Document } from 'mongoose';

// 1. Định nghĩa Interface (Chỉ khai báo kiểu dữ liệu, KHÔNG chứa logic code)
export interface ITask extends Document {
  title: string;
  description?: string;
  image?: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'moderate' | 'extreme';
  dueDate: Date;

  // Relations
  category?: mongoose.Types.ObjectId;
  creator: mongoose.Types.ObjectId;
  assignee?: mongoose.Types.ObjectId;
  group?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;

  // Soft Delete
  isDeleted: boolean;
  deletedAt: Date | null;

  // 👇 [MỚI] 1. Checklist / Subtasks
  subtasks: {
    _id?: string;
    title: string;
    isCompleted: boolean;
  }[];

  // 👇 [MỚI] 2. File Attachments (Đã sửa lại cho đúng chuẩn TypeScript Interface)
  attachments: {
    _id?: string;
    name: string;
    url: string;
    type: string; // Tên field là 'type'
    uploadDate: Date; // Kiểu dữ liệu là Date
  }[];
}

// 2. Định nghĩa Schema (Nơi cấu hình Mongoose, default value, validation)
const TaskSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'completed'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'moderate', 'extreme'],
      default: 'moderate',
    },
    dueDate: { type: Date, required: true },

    category: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    group: { type: Schema.Types.ObjectId, ref: 'Group', default: null },

    // Soft Delete
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },

    // 👇 [MỚI] Subtasks Schema
    subtasks: [
      {
        title: { type: String, required: true },
        isCompleted: { type: Boolean, default: false },
      },
    ],

    // 👇 [MỚI] Attachments Schema (Đã fix lỗi CastError và type conflict)
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },

        // 🔥 QUAN TRỌNG: Khắc phục lỗi CastError do từ khóa 'type'
        type: { type: String },

        // Dùng Date.now làm default value
        uploadDate: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Indexes
TaskSchema.index({ creator: 1, status: 1 });
TaskSchema.index({ group: 1 });
TaskSchema.index({ isDeleted: 1 });

export default mongoose.model<ITask>('Task', TaskSchema);
