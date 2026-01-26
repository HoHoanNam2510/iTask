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
  Layers,
  User,
  Users,
  Clock,
  Trash2,
  Edit,
} from 'lucide-react';

import styles from './MyTask.module.scss';
import TaskItem from '~/components/TaskItem/TaskItem';
import TaskModal from '~/components/TaskModal/TaskModal';
import type { ITaskResponse } from '~/types/task';
import CommentSection from '~/components/TaskModal/CommentSection/CommentSection';
import { useAuth } from '~/context/AuthContext';
import TimeTracker from '~/components/TaskModal/TimeTracker/TimeTracker';

const cx = classNames.bind(styles);

// Helper lấy ảnh
const getImageUrl = (imagePath?: string) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http') || imagePath.startsWith('blob:')) {
    return imagePath;
  }
  const cleanPath = imagePath.replace(/\\/g, '/');
  return `http://localhost:5000/${cleanPath}`;
};

type TabType = 'all' | 'personal' | 'group';

const MyTask = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const openTaskId = searchParams.get('openTask');

  const [tasks, setTasks] = useState<ITaskResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskDetail, setSelectedTaskDetail] =
    useState<ITaskResponse | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<ITaskResponse | null>(null);

  // Fetch danh sách tasks
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

  // Logic mở task từ URL/Search
  useEffect(() => {
    const openTaskFromUrl = async () => {
      if (openTaskId) {
        // Tìm trong list hiện tại
        const existingInList = tasks.find((t) => t._id === openTaskId);
        if (existingInList) {
          setSelectedTaskId(openTaskId);
        } else {
          // Nếu không có (ví dụ task ở trang khác), fetch riêng
          try {
            const token = localStorage.getItem('token');
            const res = await axios.get(
              `http://localhost:5000/api/tasks/${openTaskId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            if (res.data.success) {
              // Set ID để UI biết đang select, và set Detail luôn
              setSelectedTaskId(openTaskId);
              setSelectedTaskDetail(res.data.task);
            }
          } catch (e) {
            setSearchParams({});
          }
        }
      }
    };
    openTaskFromUrl();
  }, [openTaskId, tasks.length]); // Thêm tasks.length để chạy lại khi list load xong

  // Sync selectedTaskDetail khi selectedTaskId thay đổi (đối với click từ list)
  useEffect(() => {
    if (selectedTaskId) {
      const found = tasks.find((t) => t._id === selectedTaskId);
      // Nếu tìm thấy trong list thì update, nếu không (trường hợp search fetch riêng) thì giữ nguyên
      if (found) setSelectedTaskDetail(found);
    } else {
      setSelectedTaskDetail(null);
    }
  }, [selectedTaskId, tasks]);

  // Reload detail khi có update (ví dụ từ TimeTracker)
  const handleReloadDetail = async () => {
    if (!selectedTaskId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `http://localhost:5000/api/tasks/${selectedTaskId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data.success) {
        fetchTasks(); // Refresh lại list bên trái
        setSelectedTaskDetail(res.data.task);
      }
    } catch (error) {
      console.error(error);
    }
  };

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
    setSearchParams({});
  };

  const handleAddTask = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditTask = () => {
    if (selectedTaskDetail) {
      setTaskToEdit(selectedTaskDetail);
      setIsModalOpen(true);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTaskDetail) return;
    if (
      window.confirm(
        `Bạn có chắc muốn chuyển công việc "${selectedTaskDetail.title}" vào thùng rác?`
      )
    ) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(
          `http://localhost:5000/api/tasks/${selectedTaskDetail._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        fetchTasks();
        handleCloseDetail();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Không thể xóa công việc này!');
      }
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (activeTab === 'personal') return !task.group;
    if (activeTab === 'group') return !!task.group;
    return true;
  });

  return (
    <div className={cx('wrapper')}>
      {!isFullScreen && (
        <header className={cx('header')}>
          <h1 className={cx('title')}>My Tasks</h1>
          <p className={cx('subtitle')}>
            Quản lý chi tiết công việc của bạn ({tasks.length})
          </p>
        </header>
      )}

      <div className={cx('container')}>
        {!isFullScreen && (
          <div className={cx('listPanel', { shrunk: !!selectedTaskId })}>
            <div className={cx('panelHeader')}>
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
              <button className={cx('addTaskBtn')} onClick={handleAddTask}>
                <Plus size={16} /> Add task
              </button>
            </div>

            <div className={cx('listContent')}>
              {loading ? (
                <p style={{ textAlign: 'center', color: '#888' }}>
                  Đang tải...
                </p>
              ) : filteredTasks.length === 0 ? (
                <p className={cx('emptyState')}>Không có công việc nào.</p>
              ) : (
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

        {/* DETAIL PANEL */}
        {selectedTaskDetail && (
          <div className={cx('detailPanel', { fullWidth: isFullScreen })}>
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

            <div className={cx('detailContent')}>
              <div className={cx('mainHeader')}>
                <h2 className={cx('bigTitle')}>{selectedTaskDetail.title}</h2>
                <div className={cx('dateInfo')}>
                  <Calendar size={14} />
                  <span>
                    Created:{' '}
                    {format(
                      new Date(selectedTaskDetail.createdAt),
                      'dd/MM/yyyy'
                    )}
                  </span>
                  {selectedTaskDetail.dueDate && (
                    <span style={{ marginLeft: 10, color: '#ef4444' }}>
                      • Due:{' '}
                      {format(
                        new Date(selectedTaskDetail.dueDate),
                        'dd/MM/yyyy'
                      )}
                    </span>
                  )}
                </div>
              </div>

              <div className={cx('splitView')}>
                <div className={cx('imageColumn')}>
                  <div className={cx('coverImage')}>
                    {getImageUrl(selectedTaskDetail.image) ? (
                      <img
                        src={getImageUrl(selectedTaskDetail.image)!}
                        alt="Cover"
                      />
                    ) : (
                      <div className={cx('placeholder')}>No cover image</div>
                    )}
                  </div>
                </div>

                <div className={cx('infoColumn')}>
                  <div className={cx('tagsRow')}>
                    <span className={cx('tag', selectedTaskDetail.priority)}>
                      {selectedTaskDetail.priority}
                    </span>
                    <span className={cx('tag', 'status')}>
                      {selectedTaskDetail.status.replace('_', ' ')}
                    </span>
                    {selectedTaskDetail.category && (
                      <span
                        className={cx('tag')}
                        style={{
                          backgroundColor: selectedTaskDetail.category.color,
                          color: '#fff',
                          border: 'none',
                        }}
                      >
                        {selectedTaskDetail.category.name}
                      </span>
                    )}
                  </div>

                  <div className={cx('section')}>
                    <h3>Description</h3>
                    <p>{selectedTaskDetail.description || 'Không có mô tả.'}</p>
                  </div>

                  {/* Checklist View */}
                  {selectedTaskDetail.subtasks &&
                    selectedTaskDetail.subtasks.length > 0 && (
                      <div className={cx('section')}>
                        <h3>
                          Checklist (
                          {
                            selectedTaskDetail.subtasks.filter(
                              (s) => s.isCompleted
                            ).length
                          }
                          /{selectedTaskDetail.subtasks.length})
                        </h3>
                        <div className={cx('checklist')}>
                          {selectedTaskDetail.subtasks.map((sub, i) => (
                            <div key={i} className={cx('checkItem')}>
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

                  {/* Attachments View */}
                  {selectedTaskDetail.attachments &&
                    selectedTaskDetail.attachments.length > 0 && (
                      <div className={cx('section')}>
                        <h3>
                          Attachments ({selectedTaskDetail.attachments.length})
                        </h3>
                        <div className={cx('fileList')}>
                          {selectedTaskDetail.attachments.map((file, i) => (
                            <a
                              key={i}
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

              {/* Time Tracker */}
              <TimeTracker
                taskId={selectedTaskDetail._id}
                taskData={selectedTaskDetail}
                onUpdate={handleReloadDetail}
              />

              {/* Comment Section */}
              <div className={cx('commentWrapper')}>
                <CommentSection
                  taskId={selectedTaskDetail._id}
                  currentUser={user}
                  groupMembers={[]}
                  // 👇 [FIX CRASH] Kiểm tra null an toàn cho group
                  groupId={
                    selectedTaskDetail.group &&
                    typeof selectedTaskDetail.group === 'object'
                      ? selectedTaskDetail.group._id
                      : undefined
                  }
                />
              </div>
            </div>

            {/* 👇 [RESTORED] Footer Buttons */}
            <div className={cx('detailFooter')}>
              <button
                className={cx('footerBtn', 'delete')}
                onClick={handleDeleteTask}
              >
                <Trash2 size={16} style={{ marginRight: 6 }} /> Delete
              </button>
              <button
                className={cx('footerBtn', 'edit')}
                onClick={handleEditTask}
              >
                <Edit size={16} style={{ marginRight: 6 }} /> Edit
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
        onSuccess={fetchTasks}
        taskToEdit={taskToEdit}
      />
    </div>
  );
};

export default MyTask;
