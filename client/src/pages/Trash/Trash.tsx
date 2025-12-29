/* src/pages/Trash/Trash.tsx */
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import classNames from 'classnames/bind';
import { Trash2, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import styles from './Trash.module.scss'; // Bạn nhớ tạo file SCSS tương ứng nhé
import { format } from 'date-fns';

const cx = classNames.bind(styles);

interface TrashTask {
  _id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  group?: { _id: string; name: string };
  deletedAt: string;
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

  // Xử lý Khôi phục
  const handleRestore = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/tasks/${id}/restore`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Loại bỏ task khỏi list sau khi restore thành công
      setTasks((prev) => prev.filter((t) => t._id !== id));
      alert('Đã khôi phục công việc thành công!');
    } catch (error) {
      alert('Lỗi khi khôi phục');
    }
  };

  // Xử lý Xóa vĩnh viễn
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
                  <span className={cx('badge', task.priority)}>
                    {task.priority}
                  </span>
                  {task.group && (
                    <span className={cx('groupName')}>
                      📂 {task.group.name}
                    </span>
                  )}
                  <span className={cx('deletedDate')}>
                    Đã xóa: {format(new Date(task.deletedAt), 'dd/MM/yyyy')}
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
