/* server/models/Task.ts */
import mongoose, { Schema, Document } from 'mongoose';

// 1. Định nghĩa Interface
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

  // Subtasks
  subtasks: {
    _id?: string;
    title: string;
    isCompleted: boolean;
  }[];

  // Attachments
  attachments: {
    _id?: string;
    name: string;
    url: string;
    type: string;
    uploadDate: Date;
  }[];
}

// 2. Định nghĩa Schema
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

    // Subtasks Schema
    subtasks: [
      {
        title: { type: String, required: true },
        isCompleted: { type: Boolean, default: false },
      },
    ],

    // Attachments Schema
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String },
        uploadDate: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    // 👇 [QUAN TRỌNG] Bật tính năng Virtuals để field 'comments' hiển thị khi query
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
TaskSchema.index({ creator: 1, status: 1 });
TaskSchema.index({ group: 1 });
TaskSchema.index({ isDeleted: 1 });

// 👇 [FIX] Thiết lập quan hệ ảo tới bảng Comment
TaskSchema.virtual('comments', {
  ref: 'Comment', // Model tham chiếu
  localField: '_id', // Field ID của Task
  foreignField: 'task', // 👈 [ĐÃ SỬA] Phải là 'task' (khớp với field trong Comment.ts)
  justOne: false, // Một Task có nhiều Comment
});

export default mongoose.model<ITask>('Task', TaskSchema);
