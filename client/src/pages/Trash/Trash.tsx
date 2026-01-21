/* client/src/pages/Trash/Trash.tsx */
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import classNames from 'classnames/bind';
import { Trash2, RotateCcw, CheckCircle2 } from 'lucide-react';
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
  // 👇 [MỚI] Thêm thông tin người tạo (cho Admin view)
  creator?: {
    _id: string;
    username: string;
    avatar?: string;
  };
}

const Trash = () => {
  const [tasks, setTasks] = useState<TrashTask[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch danh sách thùng rác
  const fetchTrash = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/tasks/trash/all', {
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
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/tasks/${id}/restore`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks((prev) => prev.filter((t) => t._id !== id));
      alert('Đã khôi phục công việc thành công!');
    } catch (error) {
      alert('Lỗi khi khôi phục');
    }
  };

  const handleForceDelete = async (id: string) => {
    if (
      !window.confirm(
        'CẢNH BÁO: Hành động này không thể hoàn tác! Bạn chắc chắn muốn xóa vĩnh viễn?'
      )
    )
      return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/tasks/${id}/force`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (error) {
      alert('Lỗi khi xóa vĩnh viễn');
    }
  };

  if (loading) return <div className={cx('wrapper')}>Đang tải...</div>;

  return (
    <div className={cx('wrapper')}>
      <header className={cx('header')}>
        <h1>Thùng rác</h1>
        <p>Các công việc đã xóa sẽ bị xóa vĩnh viễn sau 30 ngày.</p>
      </header>

      {tasks.length === 0 ? (
        <div className={cx('emptyState')}>
          <CheckCircle2 size={48} color="#10b981" />
          <p>Thùng rác trống. Tuyệt vời!</p>
        </div>
      ) : (
        <div className={cx('taskList')}>
          {tasks.map((task) => (
            <div key={task._id} className={cx('taskRow')}>
              <div className={cx('info')}>
                <h3 className={cx('title')}>{task.title}</h3>
                <div className={cx('meta')}>
                  {/* Badge Priority */}
                  <span className={cx('badge', task.priority)}>
                    {task.priority}
                  </span>

                  {/* Badge Group */}
                  {task.group && (
                    <span className={cx('groupName')}>
                      📂 {task.group.name}
                    </span>
                  )}

                  {/* 👇 [MỚI] Hiển thị Owner (dành cho Admin) */}
                  {task.creator && (
                    <div className={cx('creator')}>
                      <span style={{ color: '#6b7280', fontSize: '1.2rem' }}>
                        by
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
                    | Xóa: {format(new Date(task.deletedAt), 'dd/MM HH:mm')}
                  </span>
                </div>
              </div>

              <div className={cx('actions')}>
                <button
                  className={cx('btn', 'restore')}
                  onClick={() => handleRestore(task._id)}
                  title="Khôi phục"
                >
                  <RotateCcw size={18} /> Restore
                </button>
                <button
                  className={cx('btn', 'delete')}
                  onClick={() => handleForceDelete(task._id)}
                  title="Xóa vĩnh viễn"
                >
                  <Trash2 size={18} /> Delete
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
