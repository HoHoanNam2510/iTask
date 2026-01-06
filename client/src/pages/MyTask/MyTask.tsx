/* src/pages/MyTasks/MyTask.tsx */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import classNames from 'classnames/bind';
import { format } from 'date-fns';
import {
  Calendar,
  Maximize2,
  Minimize2,
  X,
  Plus,
  CheckCircle2,
  Circle,
  FileText,
  DownloadCloud,
  // 👇 [MỚI] Icons cho Tabs
  Layers,
  User,
  Users,
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

// Định nghĩa các loại Tab
type TabType = 'all' | 'personal' | 'group';

const MyTask = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const openTaskId = searchParams.get('openTask');

  // --- STATE ---
  const [tasks, setTasks] = useState<ITaskResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // 👇 [MỚI] State quản lý Tab
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // Modal Add/Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<ITaskResponse | null>(null);

  // --- FETCH DATA (List Tasks) ---
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // API này lấy cả Task cá nhân và Task nhóm được assign
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

  useEffect(() => {
    const openTaskFromUrl = async () => {
      if (openTaskId) {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(
            `http://localhost:5000/api/tasks/${openTaskId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (res.data.success) {
            setTaskToEdit(res.data.task);
            setIsModalOpen(true);
          }
        } catch (error) {
          console.error('Lỗi mở task từ liên kết:', error);
          setSearchParams({});
        }
      }
    };

    openTaskFromUrl();
  }, [openTaskId]);

  // --- HELPERS ---

  // 👇 [MỚI] Logic lọc task theo Tab
  const filteredTasks = tasks.filter((task) => {
    if (activeTab === 'personal') return !task.group; // Task không có group là Personal
    if (activeTab === 'group') return !!task.group; // Task có group
    return true; // All
  });

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
              {/* 👇 [MỚI] Tabs Filter */}
              <div className={cx('tabsContainer')}>
                <button
                  className={cx('tabBtn', { active: activeTab === 'all' })}
                  onClick={() => setActiveTab('all')}
                >
                  <Layers size={14} /> All
                </button>
                <button
                  className={cx('tabBtn', { active: activeTab === 'personal' })}
                  onClick={() => setActiveTab('personal')}
                >
                  <User size={14} /> Personal
                </button>
                <button
                  className={cx('tabBtn', { active: activeTab === 'group' })}
                  onClick={() => setActiveTab('group')}
                >
                  <Users size={14} /> Group
                </button>
              </div>

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
              ) : filteredTasks.length === 0 ? (
                <div className={cx('emptyState')}>
                  <p>Không có công việc nào trong mục này.</p>
                </div>
              ) : (
                // 👇 Render filteredTasks thay vì tasks
                filteredTasks.map((task) => (
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
                    {/* Hiển thị Group trong chi tiết */}
                    {selectedTask.group && (
                      <span
                        className={cx('tag')}
                        style={{ background: '#e2e8f0', color: '#475569' }}
                      >
                        <Users size={12} style={{ marginRight: 4 }} />
                        {(selectedTask.group as any).name || 'Group Task'}
                      </span>
                    )}
                  </div>

                  {/* 1. DESCRIPTION */}
                  <div className={cx('section')}>
                    <h3>Description</h3>
                    <p>
                      {selectedTask.description || 'Không có mô tả chi tiết.'}
                    </p>
                  </div>

                  {/* 2. CHECKLIST */}
                  {selectedTask.subtasks &&
                    selectedTask.subtasks.length > 0 && (
                      <div className={cx('section')}>
                        <h3>
                          Checklist (
                          {
                            selectedTask.subtasks.filter((t) => t.isCompleted)
                              .length
                          }
                          /{selectedTask.subtasks.length})
                        </h3>
                        <div className={cx('checklist')}>
                          {selectedTask.subtasks.map((sub, index) => (
                            <div key={index} className={cx('checkItem')}>
                              {sub.isCompleted ? (
                                <CheckCircle2
                                  size={18}
                                  className={cx('icon', 'done')}
                                />
                              ) : (
                                <Circle size={18} className={cx('icon')} />
                              )}
                              <span
                                className={cx('subTitle', {
                                  done: sub.isCompleted,
                                })}
                              >
                                {sub.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* 3. ATTACHMENTS */}
                  {selectedTask.attachments &&
                    selectedTask.attachments.length > 0 && (
                      <div className={cx('section')}>
                        <h3>Attachments ({selectedTask.attachments.length})</h3>
                        <div className={cx('fileList')}>
                          {selectedTask.attachments.map((file, index) => (
                            <a
                              key={index}
                              href={getImageUrl(file.url)!}
                              target="_blank"
                              rel="noreferrer"
                              className={cx('fileItem')}
                            >
                              <div className={cx('fileIcon')}>
                                <FileText size={20} />
                              </div>
                              <div className={cx('fileInfo')}>
                                <span className={cx('fileName')}>
                                  {file.name}
                                </span>
                                <span className={cx('fileDate')}>
                                  {file.uploadDate
                                    ? format(
                                        new Date(file.uploadDate),
                                        'dd/MM/yyyy'
                                      )
                                    : 'N/A'}
                                </span>
                              </div>
                              <DownloadCloud
                                size={16}
                                className={cx('downloadIcon')}
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
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

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTaskToEdit(null);
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
