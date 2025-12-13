import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import classNames from 'classnames/bind';
import { ArrowLeft, Plus, Calendar, Flag, Check, Clock } from 'lucide-react';

// Import file SCSS vừa tạo
import styles from './CategoryDetail.module.scss';
import TaskModal from '~/components/TaskModal/TaskModal';

const cx = classNames.bind(styles);

interface Task {
  _id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'moderate' | 'extreme';
  dueDate: string;
}

const CategoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [category, setCategory] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // [MỚI] State để điều khiển modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // [MỚI] Hàm reload lại dữ liệu sau khi thêm task thành công
  const handleTaskAdded = () => {
    // Gọi lại hàm fetchDetail để list task cập nhật mới nhất
    // Bạn cần tách hàm fetchDetail ra khỏi useEffect để gọi được ở đây
    fetchDetail();
  };

  // Tách hàm fetchDetail ra ngoài useEffect
  const fetchDetail = async () => {
    try {
      setIsLoading(true); // Có thể bỏ dòng này nếu muốn update ngầm không hiện loading
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `http://localhost:5000/api/categories/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data.success) {
        setCategory(res.data.category);
        setTasks(res.data.tasks);
      }
    } catch (error) {
      console.error('Lỗi tải chi tiết:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  // Format ngày tháng: 12/12
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  if (isLoading) return <div className={cx('wrapper')}>Loading...</div>;
  if (!category) return <div className={cx('wrapper')}>Category not found</div>;

  return (
    <div className={cx('wrapper')}>
      {/* 1. Nút quay lại */}
      <button
        className={cx('backBtn')}
        onClick={() => navigate('/task-categories')}
      >
        <ArrowLeft size={20} />
        Quay lại danh sách
      </button>

      {/* 2. Header Category */}
      <header
        className={cx('header')}
        style={{ borderBottomColor: category.color }} // Border màu động theo category
      >
        <div className={cx('headerInfo')}>
          <h1
            className={cx('title')}
            style={{ color: category.color }} // Tiêu đề màu động
          >
            {category.name}
          </h1>
          <p className={cx('description')}>
            {category.description || 'Chưa có mô tả cho danh mục này.'}
          </p>
        </div>

        {/* [MỚI] Bắt sự kiện click mở Modal */}
        <button
          className={cx('addBtn')}
          onClick={() => setIsTaskModalOpen(true)}
        >
          <Plus size={18} /> Thêm Task mới
        </button>
      </header>

      {/* 3. Danh sách Tasks */}
      <div className={cx('taskList')}>
        {tasks.length === 0 ? (
          <div className={cx('emptyState')}>
            <Clock size={48} style={{ opacity: 0.2 }} />
            <p>Chưa có công việc nào trong danh mục này.</p>
          </div>
        ) : (
          tasks.map((task) => (
            // --- Render trực tiếp Task Item tại đây ---
            <div key={task._id} className={cx('taskItem')}>
              {/* Bên trái: Checkbox + Title */}
              <div className={cx('taskLeft')}>
                <div
                  className={cx('statusCheckbox', {
                    completed: task.status === 'completed',
                  })}
                >
                  {task.status === 'completed' && (
                    <Check size={14} strokeWidth={4} />
                  )}
                </div>

                <div className={cx('taskContent')}>
                  <span
                    className={cx('taskTitle', {
                      completed: task.status === 'completed',
                    })}
                  >
                    {task.title}
                  </span>
                </div>
              </div>

              {/* Bên phải: Metadata (Ngày, Priority) */}
              <div className={cx('taskRight')}>
                {/* Ngày hết hạn */}
                <div className={cx('metaInfo')}>
                  <Calendar size={14} />
                  <span>{formatDate(task.dueDate)}</span>
                </div>

                {/* Độ ưu tiên */}
                <div className={cx('priorityBadge', task.priority)}>
                  {task.priority === 'extreme' && (
                    <Flag
                      size={12}
                      style={{ marginRight: 4 }}
                      fill="currentColor"
                    />
                  )}
                  {task.priority}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* [MỚI] Chèn Modal vào cuối file */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={handleTaskAdded}
        defaultCategoryId={id} // Truyền ID category hiện tại vào để form tự chọn
      />
    </div>
  );
};

export default CategoryDetail;
