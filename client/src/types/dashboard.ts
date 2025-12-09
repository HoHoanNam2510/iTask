// src/types/dashboard.ts
export interface Task {
  id: string;
  title: string;
  status: 'completed' | 'pending' | 'in-progress';
  priority: 'high' | 'medium' | 'low';
  dueDate: string; // ISO date
}

// Dữ liệu giả lập (Mock Data)
export const mockStats = [
  { name: 'Hoàn thành', value: 7, color: '#4CAF50' }, // Màu xanh lá
  { name: 'Chưa xong', value: 3, color: '#FF9800' }, // Màu cam
];

export const todayTasks: Task[] = [
  {
    id: '1',
    title: 'Hoàn thiện trang Dashboard',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2025-11-27',
  },
  {
    id: '2',
    title: 'Họp team thiết kế',
    status: 'pending',
    priority: 'high',
    dueDate: '2025-11-27',
  },
  {
    id: '3',
    title: 'Review code module Auth',
    status: 'pending',
    priority: 'medium',
    dueDate: '2025-11-27',
  },
];

export const upcomingTasks: Task[] = [
  {
    id: '4',
    title: 'Gửi báo cáo tháng',
    status: 'pending',
    priority: 'high',
    dueDate: '2025-11-29',
  },
  {
    id: '5',
    title: 'Backup cơ sở dữ liệu',
    status: 'pending',
    priority: 'low',
    dueDate: '2025-11-30',
  },
];
