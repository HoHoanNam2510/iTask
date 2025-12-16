/* src/pages/Group/Group.tsx */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import classNames from 'classnames/bind';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd'; // [MỚI] Import DnD

import styles from './Group.module.scss';
import TaskModal from '~/components/TaskModal/TaskModal';

const cx = classNames.bind(styles);
const getAvatarUrl = (avatarPath?: string) => {
  if (!avatarPath) return '';
  if (avatarPath.startsWith('http') || avatarPath.startsWith('blob:'))
    return avatarPath;
  // Nối domain backend vào trước
  return `http://localhost:5000/${avatarPath.replace(/\\/g, '/')}`;
};

// --- TYPES ---
interface UserBasic {
  _id: string;
  username: string;
  avatar?: string;
  email: string; // Đã fix thành bắt buộc để khớp với TaskModal
}

interface Task {
  _id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'completed';
  assignee: UserBasic;
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
  const [data, setData] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  // --- FETCH DATA ---
  const fetchGroupData = async () => {
    // Chỉ set loading lần đầu để trải nghiệm mượt mà khi update
    if (!data) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `http://localhost:5000/api/groups/${groupId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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

  // --- HANDLERS ---

  // 1. Thêm mới
  const handleAddTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  // 2. Chỉnh sửa
  const handleEditTask = (task: Task) => {
    // Cần map đúng format cho TaskModal nếu cần, ở đây ta truyền trực tiếp
    // do TaskModal sẽ tự xử lý fill form dựa trên _id và các field trùng tên
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  // 3. Xóa
  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa task này khỏi nhóm?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Reload data
      fetchGroupData();
    } catch (error) {
      console.error('Lỗi xóa task:', error);
      alert('Không thể xóa task!');
    }
  };

  // 4. Xử lý Kéo thả (Drag End)
  const onDragEnd = async (result: DropResult) => {
    const { destination, draggableId } = result;

    // Nếu thả ra ngoài hoặc vị trí không đổi
    if (!destination) return;
    if (
      result.source.droppableId === destination.droppableId &&
      result.source.index === destination.index
    )
      return;

    // Lấy status mới từ ID của cột (droppableId)
    const newStatus = destination.droppableId as
      | 'todo'
      | 'in_progress'
      | 'completed';

    // OPTIMISTIC UPDATE: Cập nhật UI ngay lập tức
    if (data) {
      const updatedTasks = data.tasks.map((t) =>
        t._id === draggableId ? { ...t, status: newStatus } : t
      );
      setData({ ...data, tasks: updatedTasks });
    }

    // Gọi API cập nhật Backend
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/tasks/${draggableId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Lỗi cập nhật status:', error);
      fetchGroupData(); // Revert lại dữ liệu cũ nếu lỗi
    }
  };

  // --- RENDER HELPERS ---
  if (loading) return <div className={cx('wrapper')}>Loading...</div>;
  if (!data) return <div className={cx('wrapper')}>Không tìm thấy nhóm</div>;

  // Helper lọc task
  const getTasksByStatus = (status: string) =>
    data.tasks.filter((t) => t.status === status);

  return (
    <div className={cx('wrapper')}>
      {/* Header & Stats (Giữ nguyên) */}
      <header className={cx('header')}>
        <div className={cx('info')}>
          <h1>{data.title}</h1>
          <p>{data.description}</p>
        </div>
        <div className={cx('actions')}>
          <div className={cx('members')}>
            {data.members.slice(0, 4).map((m) => (
              <div key={m._id} className={cx('avatar')} title={m.username}>
                {m.avatar ? (
                  <img
                    src={getAvatarUrl(m.avatar)}
                    alt={m.username}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  m.username.charAt(0).toUpperCase()
                )}
              </div>
            ))}
            {data.members.length > 4 && (
              <div className={cx('avatar')} style={{ background: '#ccc' }}>
                +{data.members.length - 4}
              </div>
            )}
          </div>
          <button className={cx('add-task-btn')} onClick={handleAddTask}>
            <Plus size={14} /> New Task
          </button>
          <button
            className={cx('invite-btn')}
            onClick={() => alert(`Mã mời: ${data.inviteCode}`)}
          >
            <Plus size={14} /> Invite
          </button>
        </div>
      </header>

      {/* Stats */}
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

      {/* [MỚI] KANBAN BOARD VỚI DRAG & DROP */}
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

      {/* TASK MODAL */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={() => fetchGroupData()}
        groupId={groupId}
        groupMembers={data.members}
        taskToEdit={editingTask}
      />
    </div>
  );
};

// --- SUB COMPONENTS ---

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className={cx('stat-card')}>
    <div className={cx('label')}>{label}</div>
    <div className={cx('value')}>{value}</div>
  </div>
);

// [CẬP NHẬT] Column component hỗ trợ Droppable
interface ColumnProps {
  id: string; // ID dùng cho Droppable (todo, in_progress...)
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
                  {/* Header: Title & Actions */}
                  <div className={cx('cardHeader')}>
                    <div className={cx('task-title')}>{task.title}</div>
                    <div className={cx('taskActions')}>
                      <button onClick={() => onEdit(task)}>
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(task._id)}
                        className={cx('deleteBtn')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Meta: Assignee */}
                  <div className={cx('task-meta')}>
                    {task.assignee ? (
                      <>
                        {task.assignee.avatar ? (
                          <img
                            src={getAvatarUrl(task.assignee.avatar)}
                            alt="ava"
                            className={cx('avatar-mini')}
                          />
                        ) : (
                          <div
                            className={cx('avatar-mini')}
                            style={{
                              background: '#ddd',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                            }}
                          >
                            {task.assignee.username.charAt(0)}
                          </div>
                        )}
                        <span>{task.assignee.username}</span>
                      </>
                    ) : (
                      'Unassigned'
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
