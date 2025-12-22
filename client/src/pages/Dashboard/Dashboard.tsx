/* src/pages/Dashboard/Dashboard.tsx */
import { useEffect, useState } from 'react';
import axios from 'axios';
import classNames from 'classnames/bind';
import { format } from 'date-fns';
import {
  ListTodo,
  Loader,
  CheckCircle2,
  Clock,
  CalendarDays,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';

// Import Chart components (Giữ nguyên)
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

import styles from './Dashboard.module.scss';
import { useAuth } from '~/context/AuthContext';
import type { ITaskResponse } from '~/types/task';
import TaskModal from '~/components/TaskModal/TaskModal';

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

interface Columns {
  [key: string]: ITaskResponse[];
}

const Dashboard = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Data State
  const [stats, setStats] = useState({
    total: 0,
    todo: 0,
    inProgress: 0,
    completed: 0,
  });
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [columns, setColumns] = useState<Columns>({
    todo: [],
    in_progress: [],
    completed: [],
  });

  // Modal & Editing State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  // [MỚI] State để lưu task đang sửa
  const [editingTask, setEditingTask] = useState<ITaskResponse | null>(null);

  // --- FETCH DATA ---
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      const res = await axios.get(
        `http://localhost:5000/api/dashboard/summary?date=${dateStr}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setStats(res.data.stats);
        setWeeklyData(res.data.weeklyData);

        const allTasks: ITaskResponse[] = res.data.tasks || [];
        setColumns({
          todo: allTasks.filter((t) => t.status === 'todo'),
          in_progress: allTasks.filter((t) => t.status === 'in_progress'),
          completed: allTasks.filter((t) => t.status === 'completed'),
        });
      }
    } catch (error) {
      console.error('Lỗi tải dashboard:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDate]);

  // --- HANDLERS ---

  // 1. Mở Modal Thêm Mới
  const handleOpenAdd = () => {
    setEditingTask(null); // Reset task cũ nếu có
    setIsTaskModalOpen(true);
  };

  // 2. Mở Modal Sửa
  const handleEditTask = (task: ITaskResponse) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  // 3. Xóa Task
  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa công việc này?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDashboardData(); // Reload sau khi xóa
    } catch (error) {
      console.error('Lỗi xóa task:', error);
      alert('Xóa thất bại!');
    }
  };

  // 4. Kéo thả Task (Giữ nguyên logic cũ)
  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const sourceColId = source.droppableId;
    const destColId = destination.droppableId;

    const sourceTasks = [...columns[sourceColId]];
    const destTasks =
      sourceColId === destColId ? sourceTasks : [...columns[destColId]];
    const [movedTask] = sourceTasks.splice(source.index, 1);
    const newTask = { ...movedTask, status: destColId as any };

    if (sourceColId === destColId) {
      sourceTasks.splice(destination.index, 0, newTask);
      setColumns({ ...columns, [sourceColId]: sourceTasks });
    } else {
      destTasks.splice(destination.index, 0, newTask);
      setColumns({
        ...columns,
        [sourceColId]: sourceTasks,
        [destColId]: destTasks,
      });

      // Update stats thủ công
      setStats((prev) => {
        const keyMap: any = {
          todo: 'todo',
          in_progress: 'inProgress',
          completed: 'completed',
        };
        return {
          ...prev,
          [keyMap[sourceColId]]:
            prev[keyMap[sourceColId] as keyof typeof prev] - 1,
          [keyMap[destColId]]: prev[keyMap[destColId] as keyof typeof prev] + 1,
        };
      });
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/tasks/${draggableId}`,
        { status: destColId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Lỗi update status:', error);
      fetchDashboardData();
    }
  };

  // Chart Data (Giữ nguyên)
  const barChartData = {
    labels: weeklyData.map((d) => d.name),
    datasets: [
      {
        label: 'Task',
        data: weeklyData.map((d) => d.tasks),
        backgroundColor: '#40a578',
        borderRadius: 4,
      },
    ],
  };
  const doughnutData = {
    labels: ['To Do', 'In Progress', 'Completed'],
    datasets: [
      {
        data: [stats.todo, stats.inProgress, stats.completed],
        backgroundColor: ['#e2e8f0', '#3b82f6', '#40a578'],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className={cx('wrapper')}>
      {/* Header & Stats Grid (Giữ nguyên) */}
      <header className={cx('header')}>
        <h1 className={cx('title')}>
          Hello, <span>{user?.username || 'User'}</span>! 👋
        </h1>
        <input
          type="date"
          className={cx('datePicker')}
          value={format(selectedDate, 'yyyy-MM-dd')}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
        />
      </header>

      <div className={cx('statsGrid')}>
        <StatCard
          title="Tổng"
          value={stats.total}
          icon={<ListTodo />}
          colorClass="purple"
        />
        <StatCard
          title="Đang làm"
          value={stats.inProgress}
          icon={<Loader />}
          colorClass="blue"
        />
        <StatCard
          title="Hoàn thành"
          value={stats.completed}
          icon={<CheckCircle2 />}
          colorClass="green"
        />
        <StatCard
          title="Chờ xử lý"
          value={stats.todo}
          icon={<Clock />}
          colorClass="yellow"
        />
      </div>

      <div className={cx('chartsSection')}>
        <div className={cx('chartCard')}>
          <h3>Hiệu suất 7 ngày qua</h3>
          <div style={{ width: '100%', height: 250 }}>
            <Bar
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, grid: { display: false } },
                  x: { grid: { display: false } },
                },
              }}
              data={barChartData}
            />
          </div>
        </div>
        <div className={cx('chartCard')}>
          <h3>Tiến độ ngày {format(selectedDate, 'dd/MM')}</h3>
          {stats.total === 0 ? (
            <div className={cx('emptyState')}>
              <CalendarDays
                size={48}
                style={{ opacity: 0.2, marginBottom: 10 }}
              />
              <p>Chưa có task nào!</p>
              {/* Nút thêm nhanh khi trống */}
              <button className={cx('createBtn')} onClick={handleOpenAdd}>
                <Plus size={16} style={{ marginRight: 6 }} /> Thêm ngay
              </button>
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                height: 250,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Doughnut
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'right' } },
                  layout: { padding: 20 },
                }}
                data={doughnutData}
              />
            </div>
          )}
        </div>
      </div>

      {/* --- KANBAN BOARD SECTION --- */}
      <div className={cx('kanbanSection')}>
        {/* [MỚI] Header có nút Add bên phải */}
        <div className={cx('kanbanHeader')}>
          <h3>Quản lý trạng thái công việc</h3>
          <button className={cx('addTaskBtn')} onClick={handleOpenAdd}>
            <Plus size={18} /> Thêm Task mới
          </button>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className={cx('kanbanColumns')}>
            <DroppableColumn
              id="todo"
              title="To Do"
              tasks={columns.todo}
              colorClass="todoHeader"
              onEdit={handleEditTask}
              onDelete={handleDeleteTask} // Truyền hàm xuống
            />
            <DroppableColumn
              id="in_progress"
              title="In Progress"
              tasks={columns.in_progress}
              colorClass="progressHeader"
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
            <DroppableColumn
              id="completed"
              title="Completed"
              tasks={columns.completed}
              colorClass="doneHeader"
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
          </div>
        </DragDropContext>
      </div>

      {/* Tái sử dụng Modal cho cả Add và Edit */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={() => fetchDashboardData()}
        defaultDate={selectedDate}
        taskToEdit={editingTask} // Truyền task cần sửa (nếu có)
      />
    </div>
  );
};

// --- SUB COMPONENTS ---

const StatCard = ({ title, value, icon, colorClass }: any) => (
  <div className={cx('statCard')}>
    <div className={cx('iconBox', colorClass)}>{icon}</div>
    <div className={cx('info')}>
      <h4>{title}</h4>
      <span className={cx('number')}>{value}</span>
    </div>
  </div>
);

// [CẬP NHẬT] DroppableColumn nhận thêm onEdit, onDelete
const DroppableColumn = ({
  id,
  title,
  tasks,
  colorClass,
  onEdit,
  onDelete,
}: any) => {
  return (
    <Droppable droppableId={id}>
      {(provided) => (
        <div
          className={cx('column', colorClass)}
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          <div className={cx('columnHeader')}>
            {title} <span className={cx('countBadge')}>{tasks.length}</span>
          </div>

          {tasks.map((task: ITaskResponse, index: number) => (
            <Draggable key={task._id} draggableId={task._id} index={index}>
              {(provided, snapshot) => (
                <div
                  className={cx('taskCard', {
                    isDragging: snapshot.isDragging,
                  })}
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  style={{ ...provided.draggableProps.style }}
                >
                  {/* [MỚI] Header của card chứa Title và nút Actions */}
                  <div className={cx('cardHeader')}>
                    <div className={cx('taskTitle')}>{task.title}</div>
                    <div className={cx('taskActions')}>
                      <button onClick={() => onEdit(task)} title="Sửa">
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(task._id)}
                        className={cx('deleteBtn')}
                        title="Xóa"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className={cx('taskMeta')}>
                    <span className={cx('priorityTag', task.priority)}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default Dashboard;
