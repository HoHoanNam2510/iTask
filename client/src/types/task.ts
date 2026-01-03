/* src/types/task.ts */
export interface ITaskResponse {
  _id: string;
  title: string;
  description?: string;
  image?: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'moderate' | 'extreme';
  dueDate: string;
  createdAt: string;

  category?: {
    _id: string;
    name: string;
    color: string;
  };

  group?: {
    _id: string;
    name: string;
  };

  assignee?: string;

  // 👇 [MỚI] Checklist
  subtasks?: {
    _id: string;
    title: string;
    isCompleted: boolean;
  }[];

  // 👇 [MỚI] File đính kèm
  attachments?: {
    _id: string;
    name: string;
    url: string;
    type: string;
    uploadDate: string;
  }[];
}
