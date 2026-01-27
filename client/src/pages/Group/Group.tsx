/* client/src/pages/Group/Group.tsx */
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
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
  X,
  LogOut,
  Settings,
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
import GroupModal from '~/components/Modals/GroupModal/GroupModal';
import Leaderboard from '~/components/Leaderboard/Leaderboard';
import { useAuth } from '~/context/AuthContext';
import VideoRoom from '~/components/VideoRoom/VideoRoom';
import type { IGroupDetail } from '~/types/group';

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
  return avatarPath.startsWith('http')
    ? avatarPath
    : `http://localhost:5000/${avatarPath.replace(/\\/g, '/')}`;
};

const Group: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const openTaskId = searchParams.get('openTask');
  const { user: currentUser } = useAuth();

  const [data, setData] = useState<IGroupDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const isOwner = useMemo(
    () => data?.owner?._id === currentUser?._id,
    [data, currentUser]
  );

  const fetchGroupData = async () => {
    if (!data) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `http://localhost:5000/api/groups/${groupId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) setData(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  useEffect(() => {
    if (openTaskId && data) {
      const existingTask = data.tasks.find((t) => t._id === openTaskId);
      if (existingTask) {
        setEditingTask(existingTask);
        setIsTaskModalOpen(true);
      }
    }
  }, [openTaskId, data]);

  const triggerRefresh = () => {
    setRefreshKey((p) => p + 1);
    fetchGroupData();
  };
  const onTaskModalSuccess = () => triggerRefresh();
  const handleCloseModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
    setSearchParams({});
  };
  const handleAddTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };
  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleUpdateGroup = async (formData: {
    name: string;
    description: string;
  }) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `http://localhost:5000/api/groups/${groupId}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                title: formData.name,
                description: formData.description,
              }
            : null
        );
        setIsGroupModalOpen(false);
        window.dispatchEvent(new Event('GROUP_INFO_UPDATED'));
      }
    } catch (error) {
      alert('Lỗi cập nhật nhóm');
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('CẢNH BÁO: Giải tán nhóm? Dữ liệu sẽ mất vĩnh viễn!'))
      return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.dispatchEvent(new Event('GROUP_INFO_UPDATED'));
      alert('Đã giải tán nhóm');
      navigate('/');
    } catch (error) {
      alert('Lỗi xóa nhóm');
    }
  };

  const handleKickMember = async (userId: string, username: string) => {
    if (!window.confirm(`Xóa ${username} khỏi nhóm?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/groups/${groupId}/remove-member`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchGroupData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi kick');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Chuyển task vào thùng rác?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      triggerRefresh();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi xóa task');
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination || !data) return;
    const newStatus = destination.droppableId as any;
    const updatedTasks = data.tasks.map((t) =>
      t._id === draggableId ? { ...t, status: newStatus } : t
    );
    setData({ ...data, tasks: updatedTasks });
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/tasks/${draggableId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      triggerRefresh();
    } catch (error) {
      fetchGroupData();
    }
  };

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
    const columns = {
      todo: data.tasks.filter((t) => t.status === 'todo'),
      in_progress: data.tasks.filter((t) => t.status === 'in_progress'),
      completed: data.tasks.filter((t) => t.status === 'completed'),
    };

    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const label = format(d, 'dd/MM');
      const count = data.tasks.filter((t) =>
        isSameDay(new Date(t.createdAt!), d)
      ).length;
      weeklyData.push({ name: label, tasks: count });
    }

    return {
      daily: {
        total: dailyTasks.length,
        todo: dailyTasks.filter((t) => t.status === 'todo').length,
        inProgress: dailyTasks.filter((t) => t.status === 'in_progress').length,
        completed: dailyTasks.filter((t) => t.status === 'completed').length,
      },
      weekly: weeklyData,
      columns,
    };
  }, [data, selectedDate]);

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

  if (loading) return <div className={cx('wrapper')}>Đang tải...</div>;
  if (!data) return <div className={cx('wrapper')}>Không tìm thấy nhóm</div>;

  return (
    <div className={cx('wrapper')}>
      {isMeetingActive && currentUser && (
        <VideoRoom
          roomId={groupId!}
          userId={currentUser._id}
          userName={currentUser.username}
          groupName={data.title}
          onLeave={() => setIsMeetingActive(false)}
        />
      )}

      <header className={cx('header')}>
        <div className={cx('headerLeft')}>
          <div className={cx('info')}>
            <h1>{data.title}</h1>
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
          {/* 👇 [UI/UX FIX] Members Wrapper */}
          <div className={cx('membersWrapper')}>
            <div
              className={cx('members')}
              onClick={() => setShowMembers(!showMembers)}
            >
              {data.members.slice(0, 4).map((m) => (
                <img
                  key={m._id}
                  className={cx('avatar')}
                  src={getAvatarUrl(m.avatar)}
                  alt={m.username}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      'none';
                  }}
                />
              ))}
              {data.members.length > 4 && (
                <div className={cx('avatar', 'count')}>
                  +{data.members.length - 4}
                </div>
              )}
            </div>
            {showMembers && (
              <div className={cx('membersDropdown')}>
                <div className={cx('dropdownHeader')}>
                  <h4>Members ({data.members.length})</h4>
                  <button onClick={() => setShowMembers(false)}>
                    <X size={16} />
                  </button>
                </div>
                <div className={cx('memberList')}>
                  {data.members.map((mem) => (
                    <div key={mem._id} className={cx('memberItem')}>
                      <div className={cx('memberInfo')}>
                        <img
                          src={
                            getAvatarUrl(mem.avatar) ||
                            'https://via.placeholder.com/32'
                          }
                          alt=""
                        />
                        <div className={cx('textInfo')}>
                          <span>{mem.username}</span>
                          <span className={cx('email')}>{mem.email}</span>
                        </div>
                        {data.owner._id === mem._id && (
                          <span className={cx('ownerLabel')}>Owner</span>
                        )}
                      </div>
                      {isOwner && data.owner._id !== mem._id && (
                        <button
                          className={cx('kickBtn')}
                          onClick={() =>
                            handleKickMember(mem._id, mem.username)
                          }
                          title="Kick"
                        >
                          <LogOut size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {isOwner && (
            <>
              <button
                className={cx('actionBtn', 'edit')}
                onClick={() => setIsGroupModalOpen(true)}
                title="Cài đặt"
              >
                <Settings size={20} />
              </button>
              <button
                className={cx('actionBtn', 'danger')}
                onClick={handleDeleteGroup}
                title="Giải tán"
              >
                <Trash2 size={20} />
              </button>
            </>
          )}
          <button
            className={cx('add-task-btn')}
            style={{ backgroundColor: '#e11d48' }}
            onClick={() => setIsMeetingActive(true)}
          >
            <Video size={16} /> Meeting
          </button>
          <button className={cx('add-task-btn')} onClick={handleAddTask}>
            <Plus size={16} /> New Task
          </button>
          <button
            className={cx('invite-btn')}
            onClick={() => alert(`Mã mời: ${data.inviteCode}`)}
          >
            <Plus size={16} /> Invite
          </button>
        </div>
      </header>

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
                  layout: { padding: 10 },
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
            currentUser={currentUser}
            groupOwnerId={data.owner._id}
          />
          <TaskColumn
            id="in_progress"
            title="In Progress"
            tasks={dashboardStats.columns.in_progress}
            headerClass="progressHeader"
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            currentUser={currentUser}
            groupOwnerId={data.owner._id}
          />
          <TaskColumn
            id="completed"
            title="Completed"
            tasks={dashboardStats.columns.completed}
            headerClass="doneHeader"
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            currentUser={currentUser}
            groupOwnerId={data.owner._id}
          />
        </div>
      </DragDropContext>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={handleCloseModal}
        onSuccess={onTaskModalSuccess}
        defaultGroupId={groupId}
        taskToEdit={editingTask}
        defaultDate={selectedDate}
        groupMembers={data.members}
      />
      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSubmit={handleUpdateGroup}
        initialData={{
          name: data.title,
          description: data.description,
        }}
        title="Cài đặt nhóm"
      />
    </div>
  );
};

const TaskColumn = ({
  id,
  title,
  tasks,
  headerClass,
  onEdit,
  onDelete,
  currentUser,
  groupOwnerId,
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
          {tasks.map((task: any, index: number) => {
            const isCreator = task.creator?._id === currentUser?._id;
            const isOwner = groupOwnerId === currentUser?._id;
            const canDelete =
              currentUser?.role === 'admin' || isCreator || isOwner;

            return (
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
                        {canDelete && (
                          <button
                            onClick={() => onDelete(task._id)}
                            className={cx('deleteBtn')}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className={cx('creatorTag')}>
                      Created by:{' '}
                      <span>{task.creator?.username || 'Unknown'}</span>
                    </div>
                    <div className={cx('task-meta')}>
                      {task.assignee ? (
                        <>
                          <img
                            src={getAvatarUrl(task.assignee.avatar)}
                            className={cx('avatar-mini')}
                            alt=""
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
            );
          })}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  </div>
);

const StatCard = ({ title, value, icon, colorClass }: any) => (
  <div className={cx('stat-card-modern')}>
    <div className={cx('iconBox', colorClass)}>{icon}</div>
    <div className={cx('info')}>
      <h4>{title}</h4>
      <span className={cx('number')}>{value}</span>
    </div>
  </div>
);

export default Group;
