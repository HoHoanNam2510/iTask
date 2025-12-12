import mongoose, { Schema, Document } from 'mongoose';
import shortid from 'shortid'; // Thư viện tạo mã code ngắn

export interface IGroup extends Document {
  name: string;
  description?: string;
  owner: mongoose.Types.ObjectId; // Trưởng nhóm
  members: mongoose.Types.ObjectId[]; // Danh sách thành viên
  inviteCode: string; // Mã mời (VD: Xy7Bz)
}

const GroupSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Mảng chứa ID user
    inviteCode: {
      type: String,
      unique: true,
      default: shortid.generate, // Tự động tạo mã khi save
    },
  },
  { timestamps: true }
);

export default mongoose.model<IGroup>('Group', GroupSchema);
