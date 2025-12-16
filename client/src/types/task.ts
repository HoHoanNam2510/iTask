export interface ITaskResponse {
  _id: string;
  title: string;
  description?: string;
  image?: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'moderate' | 'extreme';
  dueDate: string;

  // [MỚI] Thêm trường này để hiển thị "Created on..."
  createdAt: string;

  // [SỬA] Vì Backend có populate nên nó trả về Object
  category?: {
    _id: string;
    name: string;
    color: string;
  };

  // [SỬA] Tương tự category
  group?: {
    _id: string;
    name: string;
  };

  // Assignee trong API getTasks chưa populate nên vẫn là string (ID)
  assignee?: string;
}
