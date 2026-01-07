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

  // 👇 [MỚI] Time Tracking Data
  totalTime: number; // Tổng thời gian đã làm (milliseconds)
  timeEntries: {
    _id?: string;
    user: mongoose.Types.ObjectId; // Ai bấm giờ
    startTime: Date;
    endTime?: Date; // null nghĩa là đang chạy
    duration: number; // Thời lượng session này (ms)
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

    // 👇 [MỚI] Time Tracking Fields
    totalTime: { type: Number, default: 0 }, // Tổng ms
    timeEntries: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        startTime: { type: Date, required: true },
        endTime: { type: Date, default: null }, // Mặc định null khi Start
        duration: { type: Number, default: 0 },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
TaskSchema.index({ creator: 1, status: 1 });
TaskSchema.index({ group: 1 });
TaskSchema.index({ isDeleted: 1 });

// Virtuals
TaskSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'task',
  justOne: false,
});

export default mongoose.model<ITask>('Task', TaskSchema);
