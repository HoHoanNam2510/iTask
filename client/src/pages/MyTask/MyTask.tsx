/* client/src/pages/MyTasks/MyTask.tsx */
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

const getImageUrl = (imagePath?: string) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http') || imagePath.startsWith('blob:'))
    return imagePath;
  return `http://localhost:5000/${imagePath.replace(/\\/g, '/')}`;
};

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
  const [activeTab, setActiveTab] = useState<'all' | 'personal' | 'group'>(
    'all'
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<ITaskResponse | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setTasks(res.data.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Logic mở task từ URL/Search
  useEffect(() => {
    const openFromUrl = async () => {
      if (openTaskId) {
        const exists = tasks.find((t) => t._id === openTaskId);
        if (exists) {
          setSelectedTaskId(openTaskId);
        } else {
          try {
            const token = localStorage.getItem('token');
            const res = await axios.get(
              `http://localhost:5000/api/tasks/${openTaskId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
              setSelectedTaskId(openTaskId);
              setSelectedTaskDetail(res.data.task);
            }
          } catch (e) {
            setSearchParams({});
          }
        }
      }
    };
    openFromUrl();
  }, [openTaskId, tasks.length]);

  // 👇 [FIXED] Logic cập nhật chi tiết task và reset FullScreen khi đóng
  useEffect(() => {
    if (selectedTaskId) {
      const found = tasks.find((t) => t._id === selectedTaskId);
      if (found) setSelectedTaskDetail(found);
    } else {
      setSelectedTaskDetail(null);
      setIsFullScreen(false); // [QUAN TRỌNG] Tắt FullScreen nếu không chọn task nào -> Tránh màn hình trắng
    }
  }, [selectedTaskId, tasks]);

  const handleReloadDetail = async () => {
    if (!selectedTaskId) return;
    const token = localStorage.getItem('token');
    const res = await axios.get(
      `http://localhost:5000/api/tasks/${selectedTaskId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.data.success) {
      fetchTasks();
      setSelectedTaskDetail(res.data.task);
    }
  };

  const handleSelectTask = (id: string) => {
    if (selectedTaskId === id) {
      setSelectedTaskId(null);
      setIsFullScreen(false);
    } else {
      setSelectedTaskId(id);
      setIsFullScreen(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTaskDetail || !confirm('Xóa task?')) return;
    try {
      await axios.delete(
        `http://localhost:5000/api/tasks/${selectedTaskDetail._id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      setSelectedTaskId(null);
      fetchTasks();
    } catch (e) {
      alert('Lỗi xóa');
    }
  };

  const filteredTasks = tasks.filter(
    (t) =>
      activeTab === 'all' || (activeTab === 'personal' ? !t.group : !!t.group)
  );

  return (
    <div className={cx('wrapper')}>
      {!isFullScreen && (
        <header className={cx('header')}>
          <h1 className={cx('title')}>My Tasks</h1>
          <p className={cx('subtitle')}>
            Quản lý chi tiết công việc ({tasks.length})
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
              <button
                className={cx('addTaskBtn')}
                onClick={() => {
                  setTaskToEdit(null);
                  setIsModalOpen(true);
                }}
              >
                <Plus size={16} /> Add task
              </button>
            </div>
            <div className={cx('listContent')}>
              {loading ? (
                <p style={{ textAlign: 'center' }}>Loading...</p>
              ) : (
                filteredTasks.map((t) => (
                  <TaskItem
                    key={t._id}
                    task={t}
                    isActive={selectedTaskId === t._id}
                    onClick={() => handleSelectTask(t._id)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {selectedTaskDetail && (
          <div className={cx('detailPanel', { fullWidth: isFullScreen })}>
            <div className={cx('detailToolbar')}>
              <button
                className={cx('toolBtn')}
                onClick={() => setIsFullScreen(!isFullScreen)}
                title={isFullScreen ? 'Thu nhỏ' : 'Phóng to'}
              >
                {isFullScreen ? (
                  <Minimize2 size={20} />
                ) : (
                  <Maximize2 size={20} />
                )}
              </button>
              <button
                className={cx('toolBtn', 'close')}
                onClick={() => {
                  setSelectedTaskId(null);
                  setIsFullScreen(false); // [QUAN TRỌNG] Reset state khi bấm đóng
                  setSearchParams({});
                }}
                title="Đóng"
              >
                <X size={20} />
              </button>
            </div>
            <div className={cx('detailContent')}>
              <div className={cx('mainHeader')}>
                <h2 className={cx('bigTitle')}>{selectedTaskDetail.title}</h2>
                <div className={cx('dateInfo')}>
                  <Calendar size={14} />{' '}
                  <span>
                    {format(
                      new Date(selectedTaskDetail.createdAt),
                      'dd/MM/yyyy'
                    )}
                  </span>
                </div>
              </div>

              <div className={cx('splitView')}>
                <div className={cx('imageColumn')}>
                  <div className={cx('coverImage')}>
                    {selectedTaskDetail.image ? (
                      <img src={getImageUrl(selectedTaskDetail.image)!} />
                    ) : (
                      <div className={cx('placeholder')}>No Cover</div>
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
                  </div>
                  <div className={cx('section')}>
                    <h3>Description</h3>
                    <p>{selectedTaskDetail.description || 'No description'}</p>
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

              <TimeTracker
                taskId={selectedTaskDetail._id}
                taskData={selectedTaskDetail}
                onUpdate={handleReloadDetail}
              />

              <div className={cx('commentWrapper')}>
                <CommentSection
                  taskId={selectedTaskDetail._id}
                  currentUser={user}
                  groupMembers={[]}
                  groupId={
                    selectedTaskDetail.group
                      ? typeof selectedTaskDetail.group === 'object'
                        ? selectedTaskDetail.group._id
                        : selectedTaskDetail.group
                      : undefined
                  }
                />
              </div>
            </div>

            <div className={cx('detailFooter')}>
              <button
                className={cx('footerBtn', 'delete')}
                onClick={handleDeleteTask}
              >
                <Trash2 size={16} style={{ marginRight: 6 }} /> Delete Task
              </button>
              <button
                className={cx('footerBtn', 'edit')}
                onClick={() => {
                  setTaskToEdit(selectedTaskDetail);
                  setIsModalOpen(true);
                }}
              >
                <Edit size={16} style={{ marginRight: 6 }} /> Edit Task
              </button>
            </div>
          </div>
        )}
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTasks}
        taskToEdit={taskToEdit}
      />
    </div>
  );
};

export default MyTask;
