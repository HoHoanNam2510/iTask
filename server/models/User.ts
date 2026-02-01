/* server/models/User.ts */
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: Date;
  badges: Array<{
    code: string;
    name: string;
    icon: string;
    awardedAt: Date;
  }>;
  // 👇 [MỚI] Fields cho Reset Password
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
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
    badges: [
      {
        code: { type: String },
        name: { type: String },
        icon: { type: String },
        awardedAt: { type: Date, default: Date.now },
      },
    ],
    // 👇 [MỚI] Lưu token reset và thời gian hết hạn
    resetPasswordToken: { type: String, default: undefined },
    resetPasswordExpires: { type: Date, default: undefined },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
