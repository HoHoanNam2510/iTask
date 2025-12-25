/* server/models/AuditLog.ts */
import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  user: mongoose.Types.ObjectId; // Ai làm?
  action: string; // Hành động gì? (CREATE, UPDATE, DELETE, LOGIN...)
  collectionName: string; // Tác động lên bảng nào? (Users, Tasks...)
  targetId?: string; // ID của đối tượng bị tác động
  details?: any; // Chi tiết (VD: thay đổi từ A -> B)
  ipAddress: string; // IP người dùng
  userAgent: string; // Trình duyệt/Thiết bị
  status: 'SUCCESS' | 'FAILURE'; // Kết quả
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    collectionName: { type: String, required: true },
    targetId: { type: String },
    details: { type: Schema.Types.Mixed }, // Lưu JSON linh hoạt
    ipAddress: { type: String },
    userAgent: { type: String },
    status: { type: String, enum: ['SUCCESS', 'FAILURE'], default: 'SUCCESS' },
  },
  { timestamps: true } // Tự động có createdAt, updatedAt
);

// Index để tìm kiếm nhanh theo user hoặc ngày tháng
AuditLogSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
