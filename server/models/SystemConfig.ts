/* server/models/SystemConfig.ts */
import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemConfig extends Document {
  globalBanner: {
    isActive: boolean; // Có hiện hay không
    content: string; // Nội dung thông báo
    type: 'info' | 'warning' | 'error' | 'success'; // Màu sắc
  };
  maintenanceMode: boolean; // (Mở rộng sau này) Chế độ bảo trì
}

const SystemConfigSchema: Schema = new Schema(
  {
    globalBanner: {
      isActive: { type: Boolean, default: false },
      content: { type: String, default: '' },
      type: {
        type: String,
        enum: ['info', 'warning', 'error', 'success'],
        default: 'info',
      },
    },
    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<ISystemConfig>(
  'SystemConfig',
  SystemConfigSchema
);
