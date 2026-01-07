/* client/src/types/task.ts */
export interface IComment {
  _id: string;
  content: string;
  user: {
    _id: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
}

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

  group?:
    | {
        _id: string;
        name: string;
      }
    | string;

  assignee?:
    | string
    | {
        _id: string;
        username: string;
        avatar: string;
      };

  subtasks?: {
    _id: string;
    title: string;
    isCompleted: boolean;
  }[];

  attachments?: {
    _id: string;
    name: string;
    url: string;
    type: string;
    uploadDate: string;
  }[];

  comments?: (string | IComment)[] | any[];

  // 👇 [MỚI] Time Tracking Data
  totalTime?: number; // Tổng thời gian (ms)
  timeEntries?: {
    _id: string;
    user: {
      _id: string;
      username: string;
      avatar?: string;
    };
    startTime: string;
    endTime?: string; // null nếu đang chạy
    duration: number;
  }[];
}
