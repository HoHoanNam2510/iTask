/* src/pages/MyTasks/MyTask.tsx */
import { useState, useEffect } from 'react';
import axios from 'axios';
import classNames from 'classnames/bind';
import { format } from 'date-fns';
import {
  Calendar,
  Maximize2,
  Minimize2,
  X,
  Image as ImageIcon,
  Plus,
} from 'lucide-react';

import styles from './MyTask.module.scss';
import TaskItem from '~/components/TaskItem/TaskItem';
import TaskModal from '~/components/TaskModal/TaskModal';
import type { ITaskResponse } from '~/types/task';

const cx = classNames.bind(styles);

const MyTask = () => {
  // --- STATE ---
  const [tasks, setTasks] = useState<ITaskResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // [MỚI] State cho Modal Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<ITaskResponse | null>(null);

  // --- FETCH DATA ---
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/tasks', {
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

  // --- HELPERS ---
  const selectedTask = tasks.find((t) => t._id === selectedTaskId);

  const getImageUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    return `http://localhost:5000/${path.replace(/\\/g, '/')}`;
  };

  // --- HANDLERS ---
  const handleSelectTask = (id: string) => {
    if (selectedTaskId === id) handleCloseDetail();
    else {
      setSelectedTaskId(id);
      setIsFullScreen(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedTaskId(null);
    setIsFullScreen(false);
  };

  // [MỚI] Mở Modal Thêm mới
  const handleAddTask = () => {
    setTaskToEdit(null); // Reset task edit
    setIsModalOpen(true);
  };

  // [MỚI] Mở Modal Chỉnh sửa
  const handleEditTask = () => {
    if (selectedTask) {
      setTaskToEdit(selectedTask);
      setIsModalOpen(true);
    }
  };

  // [MỚI] Xử lý Xóa Task
  const handleDeleteTask = async () => {
    if (!selectedTask) return;

    if (
      window.confirm(`Bạn có chắc muốn xóa công việc "${selectedTask.title}"?`)
    ) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(
          `http://localhost:5000/api/tasks/${selectedTask._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Xóa thành công: Reload list & đóng detail
        fetchTasks();
        handleCloseDetail();
      } catch (error) {
        console.error('Lỗi xóa task:', error);
        alert('Không thể xóa công việc này!');
      }
    }
  };

  return (
    <div className={cx('wrapper')}>
      {/* HEADER */}
      {!isFullScreen && (
        <header className={cx('header')}>
          <h1 className={cx('title')}>My Tasks</h1>
          <p className={cx('subtitle')}>
            Quản lý chi tiết công việc của bạn ({tasks.length})
          </p>
        </header>
      )}

      <div className={cx('container')}>
        {/* --- LEFT: TASK LIST --- */}
        {!isFullScreen && (
          <div className={cx('listPanel', { shrunk: !!selectedTaskId })}>
            <div className={cx('panelHeader')}>
              <h3>Danh sách công việc</h3>
              {/* [MỚI] Nút Add Task */}
              <button
                className={cx('addTaskBtn')}
                onClick={handleAddTask}
                title="Thêm công việc mới"
              >
                <Plus size={16} /> Add task
              </button>
            </div>

            <div className={cx('listContent')}>
              {loading ? (
                <p
                  style={{ textAlign: 'center', color: '#888', marginTop: 20 }}
                >
                  Đang tải...
                </p>
              ) : tasks.length === 0 ? (
                <p
                  style={{ textAlign: 'center', color: '#888', marginTop: 20 }}
                >
                  Chưa có công việc nào.
                </p>
              ) : (
                tasks.map((task) => (
                  <TaskItem
                    key={task._id}
                    task={task}
                    isActive={selectedTaskId === task._id}
                    onClick={() => handleSelectTask(task._id)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* --- RIGHT: DETAIL VIEW --- */}
        {selectedTask && (
          <div className={cx('detailPanel', { fullWidth: isFullScreen })}>
            {/* Toolbar */}
            <div className={cx('detailToolbar')}>
              <button
                className={cx('toolBtn')}
                onClick={() => setIsFullScreen(!isFullScreen)}
              >
                {isFullScreen ? (
                  <Minimize2 size={20} />
                ) : (
                  <Maximize2 size={20} />
                )}
              </button>
              <button
                className={cx('toolBtn', 'close')}
                onClick={handleCloseDetail}
              >
                <X size={20} />
              </button>
            </div>

            {/* DETAIL CONTENT */}
            <div className={cx('detailContent')}>
              {/* 1. Title & Meta */}
              <div className={cx('mainHeader')}>
                <h2 className={cx('bigTitle')}>{selectedTask.title}</h2>
                <div className={cx('dateInfo')}>
                  <Calendar size={14} />
                  <span>
                    Created:{' '}
                    {format(
                      new Date(selectedTask.createdAt),
                      'dd/MM/yyyy HH:mm'
                    )}
                  </span>
                  {selectedTask.dueDate && (
                    <span style={{ marginLeft: 10, color: '#ef4444' }}>
                      • Due:{' '}
                      {format(new Date(selectedTask.dueDate), 'dd/MM/yyyy')}
                    </span>
                  )}
                </div>
              </div>

              {/* 2. Split View */}
              <div className={cx('splitView')}>
                {/* CỘT TRÁI: ẢNH */}
                <div className={cx('imageColumn')}>
                  <div className={cx('coverImage')}>
                    {getImageUrl(selectedTask.image) ? (
                      <img
                        src={getImageUrl(selectedTask.image)!}
                        alt="Task cover"
                      />
                    ) : (
                      <div className={cx('placeholder')}>
                        <ImageIcon size={32} />
                        <span>No Image</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* CỘT PHẢI: CHI TIẾT */}
                <div className={cx('infoColumn')}>
                  <div className={cx('tagsRow')}>
                    <span className={cx('tag', selectedTask.priority)}>
                      {selectedTask.priority}
                    </span>
                    <span className={cx('tag', 'status')}>
                      {selectedTask.status.replace('_', ' ')}
                    </span>

                    {selectedTask.category && (
                      <span
                        className={cx('tag')}
                        style={{
                          backgroundColor:
                            selectedTask.category.color || '#94a3b8',
                          color: '#fff',
                          border: 'none',
                        }}
                      >
                        {selectedTask.category.name}
                      </span>
                    )}

                    {selectedTask.group && (
                      <span
                        style={{
                          fontSize: 16,
                          color: '#666',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        Group: {selectedTask.group.name}
                      </span>
                    )}
                  </div>

                  <div className={cx('section')}>
                    <h3>Description</h3>
                    <p>
                      {selectedTask.description || 'Không có mô tả chi tiết.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={cx('detailFooter')}>
              <button
                className={cx('footerBtn', 'delete')}
                onClick={handleDeleteTask} // [MỚI] Gắn sự kiện Xóa
              >
                Delete Task
              </button>
              <button
                className={cx('footerBtn', 'edit')}
                onClick={handleEditTask} // [MỚI] Gắn sự kiện Sửa
              >
                Edit Task
              </button>
            </div>
          </div>
        )}
      </div>

      {/* [MỚI] MODAL ADD/EDIT TASK */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchTasks(); // Reload list sau khi thêm/sửa thành công
          // Nếu đang edit thì cần reload lại selectedTask (bằng cách fetchTasks sẽ tự update state tasks)
          // Nếu muốn UX tốt hơn có thể update local state tasks luôn
        }}
        taskToEdit={taskToEdit} // Truyền task cần sửa (null nếu thêm mới)
      />
    </div>
  );
};

export default MyTask;
