/* client/src/pages/Trash/Trash.tsx */
import { useEffect, useState } from 'react';
import axios from 'axios';
import classNames from 'classnames/bind';
import { Trash2, RotateCcw } from 'lucide-react';
import styles from './Trash.module.scss';
import { format } from 'date-fns';

const cx = classNames.bind(styles);

const getAvatarUrl = (avatarPath?: string) => {
  if (!avatarPath) return '';
  if (avatarPath.startsWith('http')) return avatarPath;
  return `http://localhost:5000/${avatarPath.replace(/\\/g, '/')}`;
};

interface TrashTask {
  _id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  group?: { _id: string; name: string };
  deletedAt: string;
  creator?: {
    _id: string;
    username: string;
    avatar?: string;
  };
}

const Trash = () => {
  const [tasks, setTasks] = useState<TrashTask[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Đã gọi đúng API backend
      const res = await axios.get('http://localhost:5000/api/tasks/trash', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setTasks(res.data.tasks);
      }
    } catch (error) {
      console.error('Lỗi tải thùng rác:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestore = async (id: string) => {
    if (!confirm('Khôi phục task này?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/tasks/${id}/restore`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchTrash();
    } catch (error) {
      alert('Lỗi khôi phục (Bạn có quyền không?)');
    }
  };

  const handleForceDelete = async (id: string) => {
    if (!confirm('Hành động này không thể hoàn tác. Xóa vĩnh viễn?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/tasks/${id}/force`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTrash();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi xóa vĩnh viễn');
    }
  };

  return (
    <div className={cx('wrapper')}>
      <div className={cx('header')}>
        <h1>
          <Trash2 size={28} /> Thùng rác ({tasks.length})
        </h1>
        <p>Các công việc đã xóa có thể được khôi phục hoặc xóa vĩnh viễn.</p>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', marginTop: 20 }}>Đang tải...</p>
      ) : tasks.length === 0 ? (
        <div className={cx('emptyState')}>
          <Trash2 size={48} style={{ opacity: 0.2 }} />
          <p>Thùng rác trống</p>
        </div>
      ) : (
        <div className={cx('trashList')}>
          {tasks.map((task) => (
            <div key={task._id} className={cx('trashCard')}>
              <div className={cx('info')}>
                <h3 className={cx('taskTitle')}>{task.title}</h3>
                <div className={cx('meta')}>
                  <span className={cx('badge', task.status)}>
                    {task.status.replace('_', ' ')}
                  </span>

                  {task.group && (
                    <span className={cx('groupName')}>
                      📂 {task.group.name}
                    </span>
                  )}

                  {task.creator && (
                    <div className={cx('creator')}>
                      <span
                        style={{
                          marginRight: 4,
                          color: '#64748b',
                          fontSize: '1rem',
                        }}
                      >
                        Owner:
                      </span>
                      <img
                        src={getAvatarUrl(task.creator.avatar)}
                        alt=""
                        onError={(e) =>
                          (e.currentTarget.style.display = 'none')
                        }
                        className={cx('avatar')}
                      />
                      <span className={cx('creatorName')}>
                        {task.creator.username}
                      </span>
                    </div>
                  )}

                  <span className={cx('deletedDate')}>
                    Deleted:{' '}
                    {format(new Date(task.deletedAt), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
              </div>

              <div className={cx('actions')}>
                <button
                  className={cx('btn', 'restore')}
                  onClick={() => handleRestore(task._id)}
                  title="Khôi phục lại danh sách"
                >
                  <RotateCcw size={16} /> Restore
                </button>
                <button
                  className={cx('btn', 'delete')}
                  onClick={() => handleForceDelete(task._id)}
                  title="Xóa hoàn toàn khỏi hệ thống"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Trash;
