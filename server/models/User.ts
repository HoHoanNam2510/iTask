import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string; // Có dấu ? vì sau này có thể login bằng Google/Facebook ko cần pass
  avatar?: string;
  createdAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    avatar: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
