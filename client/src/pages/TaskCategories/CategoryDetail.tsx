/* client/src/pages/CategoryDetail/CategoryDetail.tsx */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { ArrowLeft, Plus, Layers } from 'lucide-react';

import styles from './CategoryDetail.module.scss';
import TaskModal from '~/components/TaskModal/TaskModal';
// 👇 [MỚI] Import TaskItem để tái sử dụng UI
import TaskItem from '~/components/TaskItem/TaskItem';
import type { ITaskResponse } from '~/types/task';
import httpRequest from '~/utils/httpRequest';

const cx = classNames.bind(styles);

const CategoryDetail = () => {
  const { id } = useParams(); // Category ID
  const navigate = useNavigate();

  const [category, setCategory] = useState<any>(null);
  // 👇 Sử dụng ITaskResponse chuẩn
  const [tasks, setTasks] = useState<ITaskResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  // 👇 [MỚI] State để lưu task đang cần edit
  const [taskToEdit, setTaskToEdit] = useState<ITaskResponse | null>(null);

  const fetchCategoryDetail = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      // 1. Lấy thông tin category
      const catRes = await httpRequest.get(`/api/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 2. Lấy danh sách task thuộc category này
      // (Lưu ý: Backend cần hỗ trợ filter ?categoryId=... hoặc ta filter ở FE nếu API trả về all)
      // Ở đây giả định bạn có API get tasks hỗ trợ filter hoặc ta fetch all rồi filter
      const taskRes = await httpRequest.get(`/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (catRes.data.success) {
        setCategory(catRes.data.category);
      }
      if (taskRes.data.success) {
        // Filter tasks thuộc category này
        const allTasks = taskRes.data.tasks as ITaskResponse[];
        const filteredTasks = allTasks.filter(
          (t) =>
            t.category &&
            typeof t.category === 'object' &&
            t.category._id === id
        );
        setTasks(filteredTasks);
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      // alert('Không thể tải dữ liệu category');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryDetail();
  }, [id]);

  // Handler: Mở modal tạo mới
  const handleAddTask = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  // 👇 [MỚI] Handler: Mở modal edit khi click vào item
  const handleEditTask = (task: ITaskResponse) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleModalClose = () => {
    setIsTaskModalOpen(false);
    setTaskToEdit(null);
  };

  const handleSuccess = () => {
    fetchCategoryDetail(); // Refresh data sau khi save
  };

  return (
    <div className={cx('wrapper')}>
      {/* Nút Back */}
      <button className={cx('backBtn')} onClick={() => navigate(-1)}>
        <ArrowLeft size={20} /> Quay lại
      </button>

      {/* Header */}
      <div className={cx('header')}>
        <div className={cx('info')}>
          <h1>{category?.name || 'Category Detail'}</h1>
          <p>
            {category?.description ||
              'Quản lý các công việc trong danh mục này'}
          </p>
        </div>
        <button className={cx('addTaskBtn')} onClick={handleAddTask}>
          <Plus size={20} /> Thêm Task
        </button>
      </div>

      {/* Danh sách Task */}
      <div className={cx('taskList')}>
        {isLoading ? (
          <p style={{ textAlign: 'center', color: '#888' }}>Đang tải...</p>
        ) : tasks.length === 0 ? (
          <div className={cx('emptyState')}>
            <Layers size={48} style={{ opacity: 0.2 }} />
            <p>Chưa có công việc nào trong danh mục này.</p>
          </div>
        ) : (
          // 👇 [MỚI] Render bằng TaskItem Component
          tasks.map((task) => (
            <TaskItem
              key={task._id}
              task={task}
              isActive={false} // Trong trang này không cần highlight active
              onClick={() => handleEditTask(task)} // Click để edit
            />
          ))
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        taskToEdit={taskToEdit} // Truyền task cần edit
        defaultCategoryId={id} // Mặc định category hiện tại nếu tạo mới
      />
    </div>
  );
};

export default CategoryDetail;
