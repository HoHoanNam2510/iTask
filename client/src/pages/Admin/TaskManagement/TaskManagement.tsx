import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import axios from 'axios';
import { Trash2, Search } from 'lucide-react';
import styles from './TaskManagement.module.scss';

const cx = classNames.bind(styles);

interface ITask {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'moderate' | 'extreme';
  dueDate: string;
  creator: {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
  };
}

const TaskManagement = () => {
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch API
  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/tasks/admin/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setTasks(res.data.tasks);
      }
    } catch (error) {
      console.error('Lỗi tải tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm('Admin: Bạn có chắc chắn muốn xóa Task này không?'))
      return;
    try {
      const token = localStorage.getItem('token');
      // Admin dùng chung API delete của user cũng được, miễn là middleware cho phép
      // Hoặc tạo API delete riêng nếu muốn strict hơn.
      // Ở đây giả sử deleteTask cũ đã ok hoặc bạn thêm logic admin vào đó.
      await axios.delete(`http://localhost:5000/api/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(tasks.filter((t) => t._id !== id));
      alert('Đã xóa task thành công!');
    } catch (error) {
      alert('Xóa thất bại');
    }
  };

  // Filter Search
  const filteredTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.creator.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading)
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>Loading Tasks...</div>
    );

  return (
    <div className={cx('wrapper')}>
      <header className={cx('header')}>
        <h1 className={cx('title')}>
          Quản lý Tasks <span className={cx('countBadge')}>{tasks.length}</span>
        </h1>
        {/* Thanh tìm kiếm đơn giản */}
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: 10,
              top: 10,
              color: '#94a3b8',
            }}
          />
          <input
            type="text"
            placeholder="Tìm theo task hoặc user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '10px 10px 10px 36px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              outline: 'none',
              minWidth: 300,
            }}
          />
        </div>
      </header>

      <div className={cx('tableContainer')}>
        <table className={cx('taskTable')}>
          <thead>
            <tr>
              <th>Task Name</th>
              <th>Creator (Owner)</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Due Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => (
              <tr key={task._id}>
                <td>
                  <div className={cx('taskInfo')}>
                    <div>{task.title}</div>
                    <div className={cx('desc')}>
                      {task.description || 'No description'}
                    </div>
                  </div>
                </td>
                <td>
                  <div className={cx('creatorInfo')}>
                    {/* Check avatar, nếu không có thì dùng placeholder hoặc icon */}
                    {task.creator.avatar ? (
                      <img
                        src={`http://localhost:5000/${task.creator.avatar.replace(
                          /\\/g,
                          '/'
                        )}`}
                        alt="avt"
                        className={cx('avatar')}
                      />
                    ) : (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#eee',
                        }}
                      />
                    )}
                    <span>{task.creator.username}</span>
                  </div>
                </td>
                <td>
                  <span className={cx('statusBadge', task.status)}>
                    {task.status.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <span className={cx('priorityBadge', task.priority)}>
                    {task.priority}
                  </span>
                </td>
                <td>{new Date(task.dueDate).toLocaleDateString('vi-VN')}</td>
                <td>
                  <button
                    className={cx('deleteBtn')}
                    onClick={() => handleDelete(task._id)}
                    title="Xóa task này"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskManagement;
