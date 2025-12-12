import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  user: mongoose.Types.ObjectId;
  subject: string;
  message: string;
  isResolved: boolean;
}

const FeedbackSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    isResolved: { type: Boolean, default: false }, // Admin đã xử lý hay chưa
  },
  { timestamps: true }
);

export default mongoose.model<IFeedback>('Feedback', FeedbackSchema);
