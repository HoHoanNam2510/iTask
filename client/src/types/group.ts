/* client/src/types/group.ts */
import type { UserBasic } from './user';
import type { ITaskResponse } from './task';

/**
 * Interface đại diện cho thông tin cơ bản của một Group
 * Thường dùng cho danh sách Group ở Sidebar hoặc các bảng tổng hợp
 */
export interface IGroup {
  _id: string;
  name: string;
  description?: string;
  owner: string | UserBasic;
  members: string[] | UserBasic[];
  inviteCode: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Interface chi tiết của Group khi vào trang quản trị nhóm
 * Được ánh xạ khớp với API: getGroupDetails trong groupController.ts
 */
export interface IGroupDetail {
  id: string; // Mapping từ group._id của Backend
  title: string; // Mapping từ group.name của Backend
  description: string;
  inviteCode?: string;
  members: UserBasic[];
  owner: UserBasic; // Thông tin đầy đủ của chủ nhóm để check quyền Owner trên FE
  tasks: ITaskResponse[];
}

/**
 * Type hỗ trợ cho các chức năng cập nhật thông tin nhóm của Owner
 */
export type UpdateGroupInput = Pick<IGroupDetail, 'title' | 'description'>;
