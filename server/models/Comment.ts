import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  content: string;
  task: mongoose.Types.ObjectId; // Thuộc về Task nào
  user: mongoose.Types.ObjectId; // Ai comment
  createdAt: Date;
}

const CommentSchema: Schema = new Schema(
  {
    content: { type: String, required: true },
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true } // Tự động tạo createdAt, updatedAt
);

export default mongoose.model<IComment>('Comment', CommentSchema);
