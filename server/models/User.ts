/* server/models/User.ts */
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: Date;
  // 👇 [MỚI] Thêm field badges
  badges: Array<{
    code: string;
    name: string;
    icon: string;
    awardedAt: Date;
  }>;
}

const UserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    avatar: { type: String, default: '' },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // 👇 [MỚI] Định nghĩa mảng badges
    badges: [
      {
        code: { type: String }, // VD: HARD_BEE
        name: { type: String }, // VD: Ong Chăm Chỉ
        icon: { type: String }, // VD: 🐝
        awardedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
