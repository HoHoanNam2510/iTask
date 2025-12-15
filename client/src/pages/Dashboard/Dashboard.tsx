import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';

// --- IMPORT CHART.JS ---
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
import TaskModal from '~/components/TaskModal/TaskModal';

// Đăng ký các thành phần biểu đồ
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
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Fetch Data
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      const res = await axios.get(
        `http://localhost:5000/api/dashboard/summary?date=${dateStr}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        setStats(res.data.stats);
        setWeeklyData(res.data.weeklyData);
      }
    } catch (error) {
      console.error('Lỗi tải dashboard:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDate]);

  // --- CẤU HÌNH BIỂU ĐỒ CỘT (BAR CHART) ---
  const barChartData = {
    // Lấy nhãn ngày từ weeklyData (đảo ngược mảng nếu cần thiết)
    labels: weeklyData.map((d) => d.name),
    datasets: [
      {
        label: 'Số lượng Task',
        data: weeklyData.map((d) => d.tasks),
        backgroundColor: '#40a578', // Màu xanh chủ đạo
        borderRadius: 4,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }, // Ẩn chú thích
      title: { display: false },
    },
    scales: {
      y: { beginAtZero: true, grid: { display: false } },
      x: { grid: { display: false } },
    },
  };

  // --- CẤU HÌNH BIỂU ĐỒ TRÒN (DOUGHNUT CHART) ---
  const doughnutData = {
    labels: ['To Do', 'In Progress', 'Completed'],
    datasets: [
      {
        data: [stats.todo, stats.inProgress, stats.completed],
        backgroundColor: [
          '#e2e8f0', // Grey
          '#3b82f6', // Blue
          '#40a578', // Green
        ],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const },
    },
    cutout: '70%', // Tạo lỗ rỗng ở giữa
  };

  return (
    <div className={cx('wrapper')}>
      {/* 1. Header & Date Picker */}
      <header className={cx('header')}>
        <h1 className={cx('title')}>
          Hello, <span>{user?.name || 'User'}</span>! 👋
        </h1>
        <input
          type="date"
          className={cx('datePicker')}
          value={format(selectedDate, 'yyyy-MM-dd')}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
        />
      </header>

      {/* 2. Stats Cards */}
      <div className={cx('statsGrid')}>
        <StatCard
          title="Tổng công việc"
          value={stats.total}
          icon={<ListTodo />}
          colorClass="purple"
        />
        <StatCard
          title="Đang thực hiện"
          value={stats.inProgress}
          icon={<Loader />}
          colorClass="blue"
        />
        <StatCard
          title="Đã hoàn thành"
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

      {/* 3. Charts Section */}
      <div className={cx('chartsSection')}>
        {/* Biểu đồ Cột */}
        <div className={cx('chartCard')}>
          <h3>Hiệu suất 7 ngày qua</h3>
          <div style={{ width: '100%', height: 300 }}>
            {/* Render Bar Chart */}
            <Bar options={barOptions} data={barChartData} />
          </div>
        </div>

        {/* Biểu đồ Tròn */}
        <div className={cx('chartCard')}>
          <h3>Tiến độ ngày {format(selectedDate, 'dd/MM')}</h3>
          {stats.total === 0 ? (
            <div className={cx('emptyState')}>
              <CalendarDays
                size={48}
                style={{ opacity: 0.2, marginBottom: 10 }}
              />
              <p>Ngày này chưa có task nào!</p>
              <button
                className={cx('createBtn')}
                onClick={() => setIsTaskModalOpen(true)}
              >
                <Plus size={16} style={{ marginRight: 6 }} />
                Thêm ngay
              </button>
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                height: 300,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              {/* Render Doughnut Chart */}
              <Doughnut options={doughnutOptions} data={doughnutData} />
            </div>
          )}
        </div>
      </div>

      {/* Modal thêm task */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={() => {
          fetchDashboardData();
        }}
        defaultDate={selectedDate}
      />
    </div>
  );
};

// Component con StatCard giữ nguyên
const StatCard = ({ title, value, icon, colorClass }: any) => (
  <div className={cx('statCard')}>
    <div className={cx('iconBox', colorClass)}>{icon}</div>
    <div className={cx('info')}>
      <h4>{title}</h4>
      <span className={cx('number')}>{value}</span>
    </div>
  </div>
);

export default Dashboard;
