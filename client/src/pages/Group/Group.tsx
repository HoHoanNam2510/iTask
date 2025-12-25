/* src/pages/Group/Group.tsx */
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import classNames from 'classnames/bind';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';

import styles from './Group.module.scss';
import TaskModal from '~/components/TaskModal/TaskModal';
import Leaderboard from '~/components/Leaderboard/Leaderboard';

const cx = classNames.bind(styles);

// Helper lấy ảnh avatar
const getAvatarUrl = (avatarPath?: string) => {
  if (!avatarPath) return '';
  if (avatarPath.startsWith('http') || avatarPath.startsWith('blob:'))
    return avatarPath;
  return `http://localhost:5000/${avatarPath.replace(/\\/g, '/')}`;
};

// --- TYPES ---
interface UserBasic {
  _id: string;
  username: string;
  avatar?: string;
  email: string;
}

interface Task {
  _id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'completed';
  assignee: UserBasic;
  priority?: string;
  // Thêm các field khác nếu cần
}

interface GroupData {
  _id: string;
  title: string;
  description: string;
  members: UserBasic[];
  tasks: Task[];
  inviteCode?: string;
}

const Group: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const openTaskId = searchParams.get('openTask');

  const [data, setData] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  // State dùng để kích hoạt refresh Leaderboard
  const [refreshKey, setRefreshKey] = useState(0);

  // Helper function để trigger refresh
  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    fetchGroupData(); // Load lại cả board cho chắc chắn đồng bộ
  };

  // --- FETCH DATA ---
  const fetchGroupData = async () => {
    if (!data) setLoading(true); // Chỉ hiện loading lần đầu
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `http://localhost:5000/api/groups/${groupId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const apiData = res.data.data;
        setData({
          _id: apiData.id,
          title: apiData.title,
          description: apiData.description,
          members: apiData.members,
          tasks: apiData.tasks,
          inviteCode: apiData.inviteCode,
        });
      }
    } catch (error) {
      console.error('Lỗi tải group:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  // Tự động mở Task Modal từ URL (Deep link notification)
  useEffect(() => {
    const autoOpenTask = async () => {
      if (openTaskId && data) {
        const existingTask = data.tasks.find((t) => t._id === openTaskId);
        if (existingTask) {
          try {
            const token = localStorage.getItem('token');
            const res = await axios.get(
              `http://localhost:5000/api/tasks/${openTaskId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
              setEditingTask(res.data.task);
              setIsTaskModalOpen(true);
            }
          } catch (error) {
            console.error('Lỗi mở task:', error);
          }
        }
      }
    };
    autoOpenTask();
  }, [openTaskId, data]);

  // --- HANDLERS ---
  const handleCloseModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
    setSearchParams({}); // Xóa param URL
  };

  // Khi thêm/sửa thành công (TaskModal onSuccess)
  const onTaskModalSuccess = () => {
    triggerRefresh(); // 👈 Gọi refresh
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task); // TaskModal sẽ tự fetch chi tiết nếu cần, hoặc dùng object này
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa task này?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchGroupData(); // Reload lại board
      triggerRefresh(); // 👈 Gọi refresh
    } catch (error) {
      alert('Không thể xóa task');
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    if (
      result.source.droppableId === destination.droppableId &&
      result.source.index === destination.index
    )
      return;

    const newStatus = destination.droppableId as
      | 'todo'
      | 'in_progress'
      | 'completed';

    // Optimistic Update (Giữ nguyên để Board mượt)
    if (data) {
      const updatedTasks = data.tasks.map((t) =>
        t._id === draggableId ? { ...t, status: newStatus } : t
      );
      setData({ ...data, tasks: updatedTasks });
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/tasks/${draggableId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 👇 [QUAN TRỌNG] Sau khi update status xong, báo cho Leaderboard tải lại
      // Chỉ cần refresh nếu liên quan đến cột Completed
      if (
        newStatus === 'completed' ||
        result.source.droppableId === 'completed'
      ) {
        setRefreshKey((prev) => prev + 1);
      }
    } catch (error) {
      fetchGroupData(); // Revert nếu lỗi
    }
  };

  if (loading) return <div className={cx('wrapper')}>Đang tải dữ liệu...</div>;
  if (!data) return <div className={cx('wrapper')}>Không tìm thấy nhóm</div>;

  const getTasksByStatus = (status: string) =>
    data.tasks.filter((t) => t.status === status);

  return (
    <div className={cx('wrapper')}>
      {/* 1. Header */}
      <header className={cx('header')}>
        <div className={cx('info')}>
          <h1>{data.title}</h1>
          <p>{data.description}</p>
        </div>
        <div className={cx('actions')}>
          <div className={cx('members')}>
            {data.members.slice(0, 4).map((m) => (
              <img
                key={m._id}
                className={cx('avatar')}
                src={getAvatarUrl(m.avatar) || ''}
                alt={m.username}
                title={m.username}
                onError={(e) => {
                  // Fallback nếu ảnh lỗi
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML += `<div class="${cx(
                    'avatar'
                  )}" style="background:#ccc;display:flex;align-items:center;justify-content:center">${m.username.charAt(
                    0
                  )}</div>`;
                }}
              />
            ))}
            {data.members.length > 4 && (
              <div
                className={cx('avatar')}
                style={{ background: '#e2e8f0', color: '#64748b' }}
              >
                +{data.members.length - 4}
              </div>
            )}
          </div>
          <button className={cx('add-task-btn')} onClick={handleAddTask}>
            <Plus size={16} /> New Task
          </button>
          <button
            className={cx('invite-btn')}
            onClick={() => alert(`Mã mời tham gia: ${data.inviteCode}`)}
          >
            <Plus size={16} /> Invite
          </button>
        </div>
      </header>

      {/* 2. Stats */}
      <div className={cx('stats-container')}>
        <StatCard label="Total Tasks" value={data.tasks.length} />
        <StatCard
          label="In Progress"
          value={getTasksByStatus('in_progress').length}
        />
        <StatCard
          label="Completed"
          value={getTasksByStatus('completed').length}
        />
      </div>

      {/* 3. Leaderboard (Nằm trên Board) */}
      <div className={cx('leaderboard-section')}>
        <Leaderboard groupId={groupId || ''} refreshTrigger={refreshKey} />
      </div>

      {/* 4. Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className={cx('board-container')}>
          <TaskColumn
            id="todo"
            title="To Do"
            tasks={getTasksByStatus('todo')}
            headerClass="todoHeader"
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
          />
          <TaskColumn
            id="in_progress"
            title="In Progress"
            tasks={getTasksByStatus('in_progress')}
            headerClass="progressHeader"
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
          />
          <TaskColumn
            id="completed"
            title="Completed"
            tasks={getTasksByStatus('completed')}
            headerClass="doneHeader"
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
          />
        </div>
      </DragDropContext>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={handleCloseModal}
        onSuccess={onTaskModalSuccess}
        groupId={groupId}
        groupMembers={data?.members || []}
        taskToEdit={editingTask}
      />
    </div>
  );
};

// --- Sub Components ---

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className={cx('stat-card')}>
    <div className={cx('label')}>{label}</div>
    <div className={cx('value')}>{value}</div>
  </div>
);

interface ColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  headerClass: string;
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
}

const TaskColumn: React.FC<ColumnProps> = ({
  id,
  title,
  tasks,
  headerClass,
  onEdit,
  onDelete,
}) => (
  <div className={cx('column')}>
    <h3 className={cx(headerClass)}>
      {title} <span className={cx('count')}>{tasks.length}</span>
    </h3>
    <Droppable droppableId={id}>
      {(provided) => (
        <div
          className={cx('taskList')}
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          {tasks.map((task, index) => (
            <Draggable key={task._id} draggableId={task._id} index={index}>
              {(provided, snapshot) => (
                <div
                  className={cx('task-card', {
                    todo: task.status === 'todo',
                    inprogress: task.status === 'in_progress',
                    done: task.status === 'completed',
                    isDragging: snapshot.isDragging,
                  })}
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  style={{ ...provided.draggableProps.style }}
                >
                  <div className={cx('cardHeader')}>
                    <div className={cx('task-title')}>{task.title}</div>
                    <div className={cx('taskActions')}>
                      <button onClick={() => onEdit(task)}>
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(task._id)}
                        className={cx('deleteBtn')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className={cx('task-meta')}>
                    {task.assignee ? (
                      <>
                        <img
                          src={getAvatarUrl(task.assignee.avatar) || ''}
                          className={cx('avatar-mini')}
                          alt=""
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <span>{task.assignee.username}</span>
                      </>
                    ) : (
                      <span>Unassigned</span>
                    )}
                  </div>
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  </div>
);

export default Group;
