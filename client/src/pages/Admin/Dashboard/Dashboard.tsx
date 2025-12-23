/* src/pages/Admin/Dashboard/Dashboard.tsx */
import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import axios from 'axios';
import {
  Users,
  Layers,
  CheckSquare,
  Tag,
  Trash2,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import styles from './Dashboard.module.scss';
import { format, subDays, isSameDay } from 'date-fns';

// Register ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const cx = classNames.bind(styles);

type TabType = 'users' | 'tasks' | 'groups' | 'categories';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [loading, setLoading] = useState(false);

  // Data State (Lưu trữ dữ liệu thô từ API)
  const [dataList, setDataList] = useState<any[]>([]);

  // Stats State (Lưu trữ số liệu thống kê tính toán được)
  const [stats, setStats] = useState({
    total: 0,
    growth: 0, // Tăng trưởng tuần này so với tuần trước
    active: 0,
    newToday: 0,
  });

  // --- 1. FETCH DATA BASED ON TAB ---
  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      let endpoint = '';
      if (activeTab === 'users') endpoint = '/api/users'; // Admin API get all users
      if (activeTab === 'tasks') endpoint = '/api/tasks/admin/all';
      if (activeTab === 'groups') endpoint = '/api/groups/admin/all';
      if (activeTab === 'categories') endpoint = '/api/categories/admin/all';

      // Lưu ý: Đảm bảo Backend trả về format chuẩn { success: true, [key]: [] }
      const res = await axios.get(`http://localhost:5000${endpoint}`, config);

      if (res.data.success) {
        // Backend trả về key khác nhau tùy endpoint, ta chuẩn hóa lại
        let list = [];
        if (activeTab === 'users') list = res.data.users;
        if (activeTab === 'tasks') list = res.data.tasks;
        if (activeTab === 'groups') list = res.data.groups;
        if (activeTab === 'categories') list = res.data.categories;

        setDataList(list);
        calculateStats(list);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // --- 2. CALCULATE STATS (Frontend Calculation) ---
  const calculateStats = (list: any[]) => {
    const total = list.length;

    // Tính số lượng mới tạo hôm nay
    const today = new Date();
    const newToday = list.filter((item) =>
      isSameDay(new Date(item.createdAt), today)
    ).length;

    // Logic giả lập Active/Inactive (Tùy nghiệp vụ)
    // Ví dụ: Tasks active là 'in_progress', Users active là có avatar...
    let activeCount = 0;
    if (activeTab === 'tasks') {
      activeCount = list.filter((t) => t.status === 'in_progress').length;
    } else {
      // Mặc định hiển thị 80% là active cho đẹp nếu không có logic cụ thể
      activeCount = Math.floor(total * 0.8);
    }

    setStats({
      total,
      growth: Math.floor(Math.random() * 20), // Mockup tăng trưởng
      active: activeCount,
      newToday,
    });
  };

  // --- 3. HANDLE ACTIONS ---
  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa đối tượng này?')) return;
    try {
      const token = localStorage.getItem('token');
      // Gọi API xóa tương ứng
      let endpoint = '';
      if (activeTab === 'users') endpoint = `/api/users/${id}`;
      if (activeTab === 'tasks') endpoint = `/api/tasks/${id}`;
      if (activeTab === 'groups') endpoint = `/api/groups/admin/${id}`;
      if (activeTab === 'categories') endpoint = `/api/categories/admin/${id}`;

      await axios.delete(`http://localhost:5000${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update UI
      const newList = dataList.filter((item) => item._id !== id);
      setDataList(newList);
      calculateStats(newList);
    } catch (error) {
      alert('Xóa thất bại!');
    }
  };

  // --- 4. PREPARE CHART DATA ---
  const getChartData = () => {
    const labels = Array.from({ length: 7 }, (_, i) =>
      format(subDays(new Date(), 6 - i), 'dd/MM')
    );

    // Đếm số lượng tạo theo ngày cho biểu đồ
    const dataCounts = labels.map((dateLabel) => {
      return dataList.filter(
        (item) => format(new Date(item.createdAt), 'dd/MM') === dateLabel
      ).length;
    });

    return {
      labels,
      datasets: [
        {
          label: `New ${activeTab} (Last 7 days)`,
          data: dataCounts,
          backgroundColor: '#40a578',
          borderColor: '#40a578',
          tension: 0.4,
          fill: activeTab === 'users', // Users dùng Line Chart fill
        },
      ],
    };
  };

  return (
    <div className={cx('wrapper')}>
      {/* Header */}
      <div className={cx('header')}>
        <h1 className={cx('title')}>Admin Dashboard</h1>
        <p className={cx('subtitle')}>Quản lý toàn bộ hệ thống tập trung</p>
      </div>

      {/* Tabs */}
      <div className={cx('tabsContainer')}>
        <button
          className={cx('tabItem', { active: activeTab === 'users' })}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} /> Users
        </button>
        <button
          className={cx('tabItem', { active: activeTab === 'tasks' })}
          onClick={() => setActiveTab('tasks')}
        >
          <CheckSquare size={18} /> Tasks
        </button>
        <button
          className={cx('tabItem', { active: activeTab === 'groups' })}
          onClick={() => setActiveTab('groups')}
        >
          <Layers size={18} /> Groups
        </button>
        <button
          className={cx('tabItem', { active: activeTab === 'categories' })}
          onClick={() => setActiveTab('categories')}
        >
          <Tag size={18} /> Categories
        </button>
      </div>

      {/* Stats Cards (Dynamic content based on Tab) */}
      <div className={cx('statsGrid')}>
        <StatCard
          title={`Total ${activeTab}`}
          value={stats.total}
          icon={<Layers />}
          color="blue"
        />
        <StatCard
          title="New Today"
          value={`+${stats.newToday}`}
          icon={<Calendar />}
          color="green"
        />
        <StatCard
          title="Active"
          value={stats.active}
          icon={<TrendingUp />}
          color="purple"
        />
        <StatCard
          title="Growth"
          value={`+${stats.growth}%`}
          icon={<TrendingUp />}
          color="yellow"
        />
      </div>

      {/* Chart Section */}
      <div className={cx('chartSection')}>
        <h3>Thống kê tăng trưởng ({activeTab})</h3>
        <div style={{ height: '300px', width: '100%' }}>
          {activeTab === 'users' ? (
            <Line
              options={{
                maintainAspectRatio: false,
                responsive: true,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1, // 👈 [FIX] Chỉ hiện số nguyên (1, 2, 3...)
                      precision: 0, // Đảm bảo không hiện số thập phân
                    },
                  },
                },
              }}
              data={getChartData()}
            />
          ) : (
            <Bar
              options={{
                maintainAspectRatio: false,
                responsive: true,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1, // 👈 [FIX] Chỉ hiện số nguyên
                      precision: 0,
                    },
                  },
                },
              }}
              data={getChartData()}
            />
          )}
        </div>
      </div>

      {/* Content Section (Table or Board) */}
      <div className={cx('contentSection')}>
        {activeTab === 'tasks' ? (
          // --- VIEW CHO TASKS (KANBAN STYLE) ---
          <div className={cx('kanbanBoard')}>
            {['todo', 'in_progress', 'completed'].map((status) => (
              <div key={status} className={cx('kanbanColumn')}>
                <h3>{status.replace('_', ' ')}</h3>
                {dataList
                  .filter((t) => t.status === status)
                  .map((task) => (
                    <div key={task._id} className={cx('kanbanCard')}>
                      <div className={cx('cardHeader')}>
                        <span>{task.title}</span>
                        <button
                          onClick={() => handleDelete(task._id)}
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={14} color="#ef4444" />
                        </button>
                      </div>
                      <div className={cx('cardMeta')}>
                        <span>
                          Due:{' '}
                          {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                        </span>
                        <span
                          style={{
                            color:
                              task.priority === 'extreme' ? 'red' : 'inherit',
                          }}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 12,
                          display: 'flex',
                          gap: 6,
                          alignItems: 'center',
                        }}
                      >
                        <img
                          src={`http://localhost:5000/${
                            task.creator?.avatar || ''
                          }`}
                          style={{ width: 20, height: 20, borderRadius: '50%' }}
                          onError={(e: any) =>
                            (e.target.style.display = 'none')
                          }
                        />
                        <span>{task.creator?.username}</span>
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        ) : (
          // --- VIEW CHO USERS, GROUPS, CATEGORIES (TABLE STYLE) ---
          <div className={cx('tableScrollContainer')}>
            <table className={cx('adminTable')}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name / Title</th>
                  {activeTab === 'users' && <th>Email</th>}
                  {activeTab === 'users' && <th>Role</th>}
                  {activeTab === 'groups' && <th>Members</th>}
                  {activeTab === 'categories' && <th>Color</th>}
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dataList.map((item) => (
                  <tr key={item._id}>
                    <td style={{ fontFamily: 'monospace', color: '#94a3b8' }}>
                      #{item._id.slice(-6)}
                    </td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          fontWeight: 500,
                        }}
                      >
                        {/* Logic hiển thị Avatar/Icon tùy loại */}
                        {activeTab === 'users' && (
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: '#dbeafe',
                              color: '#1e40af',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                            }}
                          >
                            {item.username?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {activeTab === 'categories' && (
                          <Tag size={16} color={item.color} />
                        )}

                        <span>{item.username || item.name || item.title}</span>
                      </div>
                    </td>

                    {/* Cột Email cho User */}
                    {activeTab === 'users' && <td>{item.email}</td>}
                    {activeTab === 'users' && (
                      <td>
                        <span
                          className={cx(
                            'statusBadge',
                            item.role === 'admin' ? 'completed' : 'todo'
                          )}
                        >
                          {item.role}
                        </span>
                      </td>
                    )}

                    {/* Cột Members cho Group */}
                    {activeTab === 'groups' && (
                      <td>{item.members?.length || 0} users</td>
                    )}

                    {/* Cột Color cho Category */}
                    {activeTab === 'categories' && (
                      <td>
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            background: item.color,
                            borderRadius: 4,
                          }}
                        ></div>
                      </td>
                    )}

                    <td>
                      {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td>
                      <button
                        className={cx('actionBtn')}
                        onClick={() => handleDelete(item._id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-component StatCard (Tái sử dụng)
const StatCard = ({ title, value, icon, color }: any) => {
  // Map màu string sang class scss
  const colorMap: any = {
    blue: 'blue',
    green: 'green',
    yellow: 'yellow',
    purple: 'purple',
  };
  return (
    <div className={cx('statCard')}>
      <div className={cx('iconBox', colorMap[color])}>{icon}</div>
      <div className={cx('info')}>
        <h4>{title}</h4>
        <span className={cx('number')}>{value}</span>
      </div>
    </div>
  );
};

export default AdminDashboard;
