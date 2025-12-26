/* src/pages/MyTasks/MyTask.tsx */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'; // 👈 [MỚI] Import này quan trọng
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

const getImageUrl = (imagePath?: string) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http') || imagePath.startsWith('blob:')) {
    return imagePath;
  }
  const cleanPath = imagePath.replace(/\\/g, '/');
  return `http://localhost:5000/${cleanPath}`;
};

const MyTask = () => {
  // 👇 [MỚI] Hook lấy query params từ URL
  const [searchParams, setSearchParams] = useSearchParams();
  const openTaskId = searchParams.get('openTask');

  // --- STATE ---
  const [tasks, setTasks] = useState<ITaskResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Modal Add/Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<ITaskResponse | null>(null);

  // --- FETCH DATA (List Tasks) ---
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

  // 👇 [MỚI] EFFECT TỰ ĐỘNG MỞ MODAL KHI CÓ URL PARAMS (?openTask=...)
  useEffect(() => {
    const openTaskFromUrl = async () => {
      if (openTaskId) {
        try {
          const token = localStorage.getItem('token');
          // Gọi API lấy chi tiết task để đảm bảo có đủ dữ liệu (comments, subtasks...)
          const res = await axios.get(
            `http://localhost:5000/api/tasks/${openTaskId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (res.data.success) {
            setTaskToEdit(res.data.task); // Set dữ liệu vào form
            setIsModalOpen(true); // Bật modal lên
          }
        } catch (error) {
          console.error('Lỗi mở task từ liên kết:', error);
          // Nếu task bị xóa hoặc không quyền xem, xóa param trên URL đi
          setSearchParams({});
        }
      }
    };

    openTaskFromUrl();
  }, [openTaskId]);

  // --- HELPERS ---
  const selectedTask = tasks.find((t) => t._id === selectedTaskId);

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

  const handleAddTask = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditTask = () => {
    if (selectedTask) {
      setTaskToEdit(selectedTask);
      setIsModalOpen(true);
    }
  };

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

              <div className={cx('splitView')}>
                <div className={cx('imageColumn')}>
                  <div className={cx('coverImage')}>
                    {getImageUrl(selectedTask.image) ? (
                      <img
                        src={getImageUrl(selectedTask.image)!}
                        alt="Task cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className={cx('placeholder')}>...</div>
                    )}
                  </div>
                </div>

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

            <div className={cx('detailFooter')}>
              <button
                className={cx('footerBtn', 'delete')}
                onClick={handleDeleteTask}
              >
                Delete Task
              </button>
              <button
                className={cx('footerBtn', 'edit')}
                onClick={handleEditTask}
              >
                Edit Task
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL ADD/EDIT TASK */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTaskToEdit(null);
          // 👇 [MỚI] Xóa params trên URL khi đóng Modal để F5 không bị mở lại
          setSearchParams({});
        }}
        onSuccess={() => {
          fetchTasks();
        }}
        taskToEdit={taskToEdit}
      />
    </div>
  );
};

export default MyTask;
