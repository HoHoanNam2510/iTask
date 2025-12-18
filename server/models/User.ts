import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  avatar?: string;
  role: 'user' | 'admin'; // 👈 [QUAN TRỌNG 1] Thêm dòng này
  createdAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    avatar: { type: String, default: '' },
    // 👇 [QUAN TRỌNG 2] Thêm đoạn này vào Schema
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
