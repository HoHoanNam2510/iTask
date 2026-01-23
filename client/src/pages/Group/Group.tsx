/* src/pages/Group/Group.tsx */
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Plus,
  Edit2,
  Trash2,
  Video,
  ListTodo,
  Loader,
  CheckCircle2,
  Clock,
  CalendarDays,
  X, // Thêm icon X để dùng cho nút Kick
} from 'lucide-react';
import classNames from 'classnames/bind';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import { format, isSameDay, subDays } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

import styles from './Group.module.scss';
import TaskModal from '~/components/TaskModal/TaskModal';
import Leaderboard from '~/components/Leaderboard/Leaderboard';
import { useAuth } from '~/context/AuthContext';
import VideoRoom from '~/components/VideoRoom/VideoRoom';
import type { IGroupDetail } from '~/types/group'; // [MỚI] Import type đã định nghĩa

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const cx = classNames.bind(styles);

const getAvatarUrl = (avatarPath?: string) => {
  if (!avatarPath) return '';
  if (avatarPath.startsWith('http') || avatarPath.startsWith('blob:'))
    return avatarPath;
  return `http://localhost:5000/${avatarPath.replace(/\\/g, '/')}`;
};

// Interface cho Task (giữ nguyên để dùng cho render board)
interface Task {
  _id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'completed';
  assignee: any;
  priority?: string;
  dueDate?: string;
  createdAt?: string;
}

const Group: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const openTaskId = searchParams.get('openTask');
  const { user } = useAuth();

  const [data, setData] = useState<IGroupDetail | null>(null); // [MỚI] Dùng IGroupDetail
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // [MỚI] Kiểm tra quyền Owner
  const isOwner = useMemo(() => {
    return data?.owner?._id === user?._id;
  }, [data, user]);

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    fetchGroupData();
  };

  const fetchGroupData = async () => {
    if (!data) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `http://localhost:5000/api/groups/${groupId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setData(res.data.data); // Backend đã trả về đúng cấu trúc IGroupDetail (id, title, members, owner...)
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

  // --- [MỚI] HANDLERS CHO OWNER ---

  const handleEditGroup = async () => {
    const newName = prompt('Nhập tên nhóm mới:', data?.title);
    if (!newName) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/groups/${groupId}`,
        { name: newName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      triggerRefresh();
    } catch (error) {
      alert('Lỗi cập nhật');
    }
  };

  const handleDisbandGroup = async () => {
    if (
      window.confirm(
        'BẠN CÓ CHẮC CHẮN muốn giải tán nhóm? Toàn bộ task sẽ bị xóa vĩnh viễn!'
      )
    ) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/groups/${groupId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        window.location.href = '/dashboard';
      } catch (error) {
        alert('Lỗi khi giải tán nhóm');
      }
    }
  };

  const handleKickMember = async (memberId: string, memberName: string) => {
    if (window.confirm(`Xóa ${memberName} ra khỏi nhóm?`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(
          `http://localhost:5000/api/groups/${groupId}/remove-member`,
          { memberId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        triggerRefresh();
      } catch (error) {
        alert('Lỗi khi xóa thành viên');
      }
    }
  };

  // --- LOGIC STATS & CHARTS (Giữ nguyên) ---

  const dashboardStats = useMemo(() => {
    if (!data)
      return {
        daily: { total: 0, todo: 0, inProgress: 0, completed: 0 },
        weekly: [],
        columns: { todo: [], in_progress: [], completed: [] },
      };

    const dailyTasks = data.tasks.filter((t) =>
      t.dueDate ? isSameDay(new Date(t.dueDate), selectedDate) : false
    );

    const dailyStats = {
      total: dailyTasks.length,
      todo: dailyTasks.filter((t) => t.status === 'todo').length,
      inProgress: dailyTasks.filter((t) => t.status === 'in_progress').length,
      completed: dailyTasks.filter((t) => t.status === 'completed').length,
    };

    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const label = format(d, 'dd/MM');
      const count = data.tasks.filter((t) => {
        const targetDate = t.createdAt ? new Date(t.createdAt) : new Date();
        return isSameDay(targetDate, d);
      }).length;
      weeklyData.push({ name: label, tasks: count });
    }

    const columns = {
      todo: data.tasks.filter((t) => t.status === 'todo'),
      in_progress: data.tasks.filter((t) => t.status === 'in_progress'),
      completed: data.tasks.filter((t) => t.status === 'completed'),
    };

    return { daily: dailyStats, weekly: weeklyData, columns };
  }, [data, selectedDate]);

  const handleCloseModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
    setSearchParams({});
  };

  const onTaskModalSuccess = () => {
    triggerRefresh();
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Bạn chắc chắn muốn chuyển task này vào thùng rác?'))
      return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      triggerRefresh();
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
      if (
        newStatus === 'completed' ||
        result.source.droppableId === 'completed'
      ) {
        setRefreshKey((prev) => prev + 1);
      }
    } catch (error) {
      fetchGroupData();
    }
  };

  const barChartData = {
    labels: dashboardStats.weekly.map((d) => d.name),
    datasets: [
      {
        label: 'New Tasks',
        data: dashboardStats.weekly.map((d) => d.tasks),
        backgroundColor: '#40a578',
        borderRadius: 4,
      },
    ],
  };

  const doughnutData = {
    labels: ['To Do', 'In Progress', 'Completed'],
    datasets: [
      {
        data: [
          dashboardStats.daily.todo,
          dashboardStats.daily.inProgress,
          dashboardStats.daily.completed,
        ],
        backgroundColor: ['#e2e8f0', '#3b82f6', '#40a578'],
        borderWidth: 0,
      },
    ],
  };

  if (loading) return <div className={cx('wrapper')}>Đang tải dữ liệu...</div>;
  if (!data) return <div className={cx('wrapper')}>Không tìm thấy nhóm</div>;

  return (
    <div className={cx('wrapper')}>
      {isMeetingActive && user && groupId && (
        <VideoRoom
          roomId={groupId}
          userId={user._id}
          userName={user.username}
          groupName={data.title}
          onLeave={() => setIsMeetingActive(false)}
        />
      )}

      <header className={cx('header')}>
        <div className={cx('headerLeft')}>
          <div className={cx('info')}>
            {/* Cập nhật hiển thị Title kèm nút Edit cho Owner */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1>{data.title}</h1>
              {isOwner && (
                <button className={cx('iconEditBtn')} onClick={handleEditGroup}>
                  <Edit2 size={16} />
                </button>
              )}
            </div>
            <p>{data.description}</p>
          </div>
          <input
            type="date"
            className={cx('datePicker')}
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
          />
        </div>

        <div className={cx('actions')}>
          {/* Cập nhật danh sách Member có nút Kick cho Owner */}
          <div className={cx('members')}>
            {data.members.map((m) => (
              <div key={m._id} className={cx('avatarWrapper')}>
                <img
                  className={cx('avatar')}
                  src={getAvatarUrl(m.avatar) || ''}
                  alt={m.username}
                  title={
                    isOwner && m._id !== user?._id
                      ? `Kick ${m.username}`
                      : m.username
                  }
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {isOwner && m._id !== user?._id && (
                  <button
                    className={cx('kickBadge')}
                    onClick={() => handleKickMember(m._id, m.username)}
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Nút giải tán cho Owner */}
          {isOwner && (
            <button
              className={cx('disbandBtn')}
              onClick={handleDisbandGroup}
              title="Giải tán nhóm"
            >
              <Trash2 size={16} />
            </button>
          )}

          <button
            className={cx('add-task-btn')}
            style={{ backgroundColor: '#e11d48' }}
            onClick={() => setIsMeetingActive(true)}
            title="Tham gia cuộc họp"
          >
            <Video size={16} /> Meeting
          </button>

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

      {/* --- PHẦN STATS, CHARTS, BOARD (Giữ nguyên) --- */}
      <div className={cx('statsGrid')}>
        <StatCard
          title="Tổng"
          value={dashboardStats.daily.total}
          icon={<ListTodo />}
          colorClass="purple"
        />
        <StatCard
          title="Đang làm"
          value={dashboardStats.daily.inProgress}
          icon={<Loader />}
          colorClass="blue"
        />
        <StatCard
          title="Hoàn thành"
          value={dashboardStats.daily.completed}
          icon={<CheckCircle2 />}
          colorClass="green"
        />
        <StatCard
          title="Chờ xử lý"
          value={dashboardStats.daily.todo}
          icon={<Clock />}
          colorClass="yellow"
        />
      </div>

      <div className={cx('chartsSection')}>
        <div className={cx('chartCard')}>
          <h3>Hoạt động 7 ngày qua (New Tasks)</h3>
          <div style={{ width: '100%', height: 200 }}>
            <Bar
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { display: false },
                    ticks: { stepSize: 1 },
                  },
                  x: { grid: { display: false } },
                },
              }}
              data={barChartData}
            />
          </div>
        </div>
        <div className={cx('chartCard')}>
          <h3>Tiến độ ngày {format(selectedDate, 'dd/MM')}</h3>
          {dashboardStats.daily.total === 0 ? (
            <div className={cx('emptyState')}>
              <CalendarDays
                size={32}
                style={{ opacity: 0.2, marginBottom: 10 }}
              />
              <p>Chưa có task!</p>
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                height: 200,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Doughnut
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'right' } },
                }}
                data={doughnutData}
              />
            </div>
          )}
        </div>
      </div>

      <div className={cx('leaderboard-section')}>
        <Leaderboard groupId={groupId || ''} refreshTrigger={refreshKey} />
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className={cx('board-container')}>
          <TaskColumn
            id="todo"
            title="To Do"
            tasks={dashboardStats.columns.todo}
            headerClass="todoHeader"
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
          />
          <TaskColumn
            id="in_progress"
            title="In Progress"
            tasks={dashboardStats.columns.in_progress}
            headerClass="progressHeader"
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
          />
          <TaskColumn
            id="completed"
            title="Completed"
            tasks={dashboardStats.columns.completed}
            headerClass="doneHeader"
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
          />
        </div>
      </DragDropContext>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={handleCloseModal}
        onSuccess={onTaskModalSuccess}
        groupId={groupId}
        groupMembers={data?.members || []}
        taskToEdit={editingTask}
        defaultDate={selectedDate}
      />
    </div>
  );
};

// --- SUB-COMPONENTS (Giữ nguyên) ---
const StatCard = ({ title, value, icon, colorClass }: any) => (
  <div className={cx('stat-card-modern')}>
    <div className={cx('iconBox', colorClass)}>{icon}</div>
    <div className={cx('info')}>
      <h4>{title}</h4>
      <span className={cx('number')}>{value}</span>
    </div>
  </div>
);

const TaskColumn = ({
  id,
  title,
  tasks,
  headerClass,
  onEdit,
  onDelete,
}: any) => (
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
          {tasks.map((task: any, index: number) => (
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
                          src={getAvatarUrl(task.assignee.avatar)}
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
