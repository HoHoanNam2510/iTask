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
  FileClock,
  Settings,
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
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import styles from './Dashboard.module.scss';
import { format, subDays, isSameDay } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

const cx = classNames.bind(styles);

type TabType =
  | 'users'
  | 'tasks'
  | 'groups'
  | 'categories'
  | 'logs'
  | 'settings';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  // 👇 [ĐÃ SỬA] Bỏ biến loading ra khỏi destructuring vì không dùng, chỉ giữ setLoading
  const [, setLoading] = useState(false);

  // Data State
  const [dataList, setDataList] = useState<any[]>([]);

  // Stats State
  const [stats, setStats] = useState({
    total: 0,
    growth: 0,
    active: 0,
    newToday: 0,
  });

  // State cho Settings
  const [sysConfig, setSysConfig] = useState({
    globalBanner: {
      isActive: false,
      content: '',
      type: 'info' as 'info' | 'warning' | 'error' | 'success',
    },
    maintenanceMode: false,
  });
  const [savingConfig, setSavingConfig] = useState(false);

  // --- 1. FETCH DATA BASED ON TAB ---
  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      let endpoint = '';
      if (activeTab === 'users') endpoint = '/api/users';
      if (activeTab === 'tasks') endpoint = '/api/tasks/admin/all';
      if (activeTab === 'groups') endpoint = '/api/groups/admin/all';
      if (activeTab === 'categories') endpoint = '/api/categories/admin/all';
      if (activeTab === 'logs') endpoint = '/api/admin/logs?limit=50';
      if (activeTab === 'settings') endpoint = '/api/system';

      const res = await axios.get(`http://localhost:5000${endpoint}`, config);

      if (res.data.success) {
        if (activeTab === 'settings') {
          setSysConfig(res.data.config);
          setDataList([]);
        } else {
          let list = [];
          if (activeTab === 'users') list = res.data.users;
          if (activeTab === 'tasks') list = res.data.tasks;
          if (activeTab === 'groups') list = res.data.groups;
          if (activeTab === 'categories') list = res.data.categories;
          if (activeTab === 'logs') list = res.data.logs;

          setDataList(list);

          if (activeTab !== 'logs') {
            calculateStats(list);
          }
        }
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

  // --- 2. CALCULATE STATS ---
  const calculateStats = (list: any[]) => {
    const total = list.length;
    const today = new Date();
    const newToday = list.filter((item) =>
      isSameDay(new Date(item.createdAt), today)
    ).length;

    let activeCount = 0;
    if (activeTab === 'tasks') {
      activeCount = list.filter((t) => t.status === 'in_progress').length;
    } else {
      activeCount = Math.floor(total * 0.8);
    }

    setStats({
      total,
      growth: Math.floor(Math.random() * 20),
      active: activeCount,
      newToday,
    });
  };

  // --- 3. HANDLE ACTIONS ---
  const handleDelete = async (id: string) => {
    if (activeTab === 'logs' || activeTab === 'settings') return;

    if (!window.confirm('Bạn có chắc muốn xóa đối tượng này?')) return;
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      if (activeTab === 'users') endpoint = `/api/users/${id}`;
      if (activeTab === 'tasks') endpoint = `/api/tasks/${id}`;
      if (activeTab === 'groups') endpoint = `/api/groups/admin/${id}`;
      if (activeTab === 'categories') endpoint = `/api/categories/admin/${id}`;

      await axios.delete(`http://localhost:5000${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newList = dataList.filter((item) => item._id !== id);
      setDataList(newList);
      calculateStats(newList);
    } catch (error) {
      alert('Xóa thất bại!');
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSavingConfig(true);
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/system', sysConfig, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Đã lưu cấu hình hệ thống!');
    } catch (error) {
      alert('Lỗi khi lưu cấu hình');
    } finally {
      setSavingConfig(false);
    }
  };

  // --- 4. PREPARE CHART DATA ---
  const getChartData = () => {
    const labels = Array.from({ length: 7 }, (_, i) =>
      format(subDays(new Date(), 6 - i), 'dd/MM')
    );

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
          fill: activeTab === 'users',
        },
      ],
    };
  };

  const renderMethodBadge = (action: string) => {
    let type = 'update';
    if (action === 'CREATE') type = 'create';
    if (action === 'DELETE') type = 'delete';
    if (action === 'LOGIN') type = 'login';

    return <span className={cx('methodBadge', type)}>{action}</span>;
  };

  return (
    <div className={cx('wrapper')}>
      <div className={cx('header')}>
        <h1 className={cx('title')}>Admin Dashboard</h1>
        <p className={cx('subtitle')}>Quản lý toàn bộ hệ thống tập trung</p>
      </div>

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
        <button
          className={cx('tabItem', { active: activeTab === 'logs' })}
          onClick={() => setActiveTab('logs')}
        >
          <FileClock size={18} /> Audit Logs
        </button>
        <button
          className={cx('tabItem', { active: activeTab === 'settings' })}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={18} /> Settings
        </button>
      </div>

      {activeTab !== 'logs' && activeTab !== 'settings' && (
        <>
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
                        ticks: { stepSize: 1, precision: 0 },
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
                        ticks: { stepSize: 1, precision: 0 },
                      },
                    },
                  }}
                  data={getChartData()}
                />
              )}
            </div>
          </div>
        </>
      )}

      <div className={cx('contentSection')}>
        {activeTab === 'tasks' ? (
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
        ) : activeTab === 'logs' ? (
          <div className={cx('tableScrollContainer')}>
            <table className={cx('adminTable')}>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Actor (User)</th>
                  <th>Action</th>
                  <th>Target (Collection)</th>
                  <th>IP Address</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dataList.map((log) => (
                  <tr key={log._id}>
                    <td style={{ fontSize: '1.2rem', color: '#64748b' }}>
                      {format(new Date(log.createdAt), 'dd/MM/yyyy - HH:mm:ss')}
                    </td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: '#ccc',
                            overflow: 'hidden',
                          }}
                        >
                          {log.user?.avatar ? (
                            <img
                              src={`http://localhost:5000/${log.user.avatar}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 10,
                              }}
                            >
                              {log.user?.username?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <span style={{ fontWeight: 500 }}>
                          {log.user?.username || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td>{renderMethodBadge(log.action)}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#475569' }}>
                        {log.collectionName}
                      </span>
                      {log.targetId && (
                        <span
                          style={{
                            fontSize: 10,
                            color: '#94a3b8',
                            display: 'block',
                          }}
                        >
                          #{log.targetId.slice(-6)}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={cx('ipText')}>
                        {log.ipAddress || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={cx(
                          'logStatus',
                          log.status === 'SUCCESS' ? 'success' : 'failure'
                        )}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'settings' ? (
          <div className={cx('settingsContainer')}>
            <div className={cx('settingCard')}>
              <h3 className={cx('cardTitle')}>
                Global Banner (Thông báo hệ thống)
              </h3>
              <p className={cx('cardDesc')}>
                Hiển thị một thanh thông báo chạy ngang trên đầu trang web của
                tất cả người dùng.
              </p>

              <div className={cx('formGroup')}>
                <label>Trạng thái</label>
                <div className={cx('toggleRow')}>
                  <label className={cx('switch')}>
                    <input
                      type="checkbox"
                      checked={sysConfig.globalBanner.isActive}
                      onChange={(e) =>
                        setSysConfig({
                          ...sysConfig,
                          globalBanner: {
                            ...sysConfig.globalBanner,
                            isActive: e.target.checked,
                          },
                        })
                      }
                    />
                    <span className={cx('slider')}></span>
                  </label>
                  <span>
                    {sysConfig.globalBanner.isActive ? 'Đang BẬT' : 'Đang TẮT'}
                  </span>
                </div>
              </div>

              <div className={cx('formGroup')}>
                <label>Nội dung thông báo</label>
                <input
                  className={cx('input')}
                  value={sysConfig.globalBanner.content}
                  onChange={(e) =>
                    setSysConfig({
                      ...sysConfig,
                      globalBanner: {
                        ...sysConfig.globalBanner,
                        content: e.target.value,
                      },
                    })
                  }
                  placeholder="Ví dụ: Hệ thống bảo trì lúc 12:00..."
                />
              </div>

              <div className={cx('formGroup')}>
                <label>Loại thông báo (Màu sắc)</label>
                <div className={cx('radioGroup')}>
                  {['info', 'warning', 'error', 'success'].map((type) => (
                    <div
                      key={type}
                      className={cx('radioItem', type, {
                        active: sysConfig.globalBanner.type === type,
                      })}
                      onClick={() =>
                        setSysConfig({
                          ...sysConfig,
                          globalBanner: {
                            ...sysConfig.globalBanner,
                            type: type as any,
                          },
                        })
                      }
                    >
                      {type.toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>

              <button
                className={cx('saveBtn')}
                onClick={handleSaveSettings}
                disabled={savingConfig}
              >
                {savingConfig ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </div>
        ) : (
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

                    {activeTab === 'groups' && (
                      <td>{item.members?.length || 0} users</td>
                    )}

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

const StatCard = ({ title, value, icon, color }: any) => {
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
