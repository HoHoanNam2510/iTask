export interface ITaskResponse {
  _id: string;
  title: string;
  description?: string;
  image?: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'moderate' | 'extreme';
  dueDate: string; // ISO String
  category?: string; // ID của category
  group?: string; // ID của group (nếu có)
  assignee?: string; // ID của user (nếu có)
}
