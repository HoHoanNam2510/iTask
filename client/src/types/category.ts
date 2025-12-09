export interface Category {
  id: string;
  name: string;
  taskCount: number; // Số lượng task đang có (giả lập)
  color: string; // Màu đại diện cho Category
  description?: string;
}
