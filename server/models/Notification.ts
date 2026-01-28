/* server/models/Notification.ts */
import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId; // Người nhận thông báo
  sender: mongoose.Types.ObjectId; // Người gây ra (ví dụ: người comment)
  type: 'mention' | 'assign' | 'deadline'; // Đã xóa 'invite'
  text: string; // Nội dung hiển thị
  link?: string; // Link để click vào (ví dụ: /tasks/123)
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['mention', 'assign', 'deadline'], // Đã xóa 'invite'
      required: true,
    },
    text: { type: String, required: true },
    link: { type: String }, // Lưu taskId hoặc groupId
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>(
  'Notification',
  NotificationSchema
);
