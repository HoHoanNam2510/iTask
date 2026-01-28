/* server/models/Feedback.ts */
import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  user: mongoose.Types.ObjectId;
  subject: string;
  message: string;
  type: 'bug' | 'feature' | 'other'; // [MỚI] Phân loại
  status: 'pending' | 'reviewing' | 'resolved'; // [MỚI] Trạng thái chi tiết hơn
  adminResponse?: string; // [MỚI] Phản hồi của admin
  createdAt: Date;
}

const FeedbackSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['bug', 'feature', 'other'],
      default: 'other',
    },
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'resolved'],
      default: 'pending',
    },
    adminResponse: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IFeedback>('Feedback', FeedbackSchema);
