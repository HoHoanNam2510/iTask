import React from 'react';
import classNames from 'classnames/bind';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  CheckCircle2,
  Circle,
  Clock,
  CalendarDays,
  MoreHorizontal, // <--- Đã thêm component này vào
} from 'lucide-react';
import styles from './Dashboard.module.scss';

const cx = classNames.bind(styles);

// --- Mock Data (Bạn có thể tách ra file types/dashboard.ts sau) ---
const mockStats = [
  { name: 'Completed', value: 7, color: '#4FB488' }, // Màu xanh (Primary)
  { name: 'Pending', value: 3, color: '#f59e0b' }, // Màu cam (Warning)
];

const todayTasks = [
  {
    id: '1',
    title: 'Hoàn thiện UI trang Dashboard',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2025-11-27',
  },
  {
    id: '2',
    title: 'Họp team Product',
    status: 'pending',
    priority: 'high',
    dueDate: '2025-11-27',
  },
  {
    id: '3',
    title: 'Fix bug login mobile',
    status: 'pending',
    priority: 'medium',
    dueDate: '2025-11-27',
  },
];

const upcomingTasks = [
  {
    id: '4',
    title: 'Gửi báo cáo tuần',
    status: 'pending',
    priority: 'high',
    dueDate: '2025-11-29',
  },
  {
    id: '5',
    title: 'Review PR từ team BE',
    status: 'pending',
    priority: 'low',
    dueDate: '2025-11-30',
  },
  {
    id: '6',
    title: 'Lên plan sprint mới',
    status: 'pending',
    priority: 'medium',
    dueDate: '2025-12-01',
  },
];

const Dashboard = () => {
  return (
    <div className={cx('wrapper')}>
      {/* Header Section */}
      <header className={cx('header')}>
        <div className={cx('welcome')}>
          <h1 className={cx('title')}>Dashboard</h1>
          <p className={cx('subtitle')}>
            Chào Guest User, bạn có 3 việc ưu tiên hôm nay.
          </p>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className={cx('gridContainer')}>
        {/* Cột Trái: Thống kê & Today's Focus */}
        <div className={cx('leftColumn')}>
          {/* Section 1: Thống kê nhanh */}
          <div className={cx('card', 'statsCard')}>
            <h3 className={cx('cardTitle')}>Tiến độ trong ngày</h3>
            <div className={cx('chartRow')}>
              <div className={cx('statInfo')}>
                <span className={cx('bigNumber')}>70%</span>
                <span className={cx('statLabel')}>Đã hoàn thành</span>
              </div>
              <div className={cx('chartContainer')}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockStats}
                      innerRadius={45}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {mockStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Section 2: Today's Focus */}
          <div className={cx('card', 'focusCard')}>
            <div className={cx('cardHeader')}>
              <h3 className={cx('cardTitle')}>Today's Focus</h3>
              <span className={cx('badge', 'high')}>High Priority</span>
            </div>

            <div className={cx('taskList')}>
              {todayTasks.map((task) => (
                <div key={task.id} className={cx('taskItem')}>
                  <div className={cx('checkIcon')}>
                    {task.status === 'completed' ? (
                      <CheckCircle2 size={20} className={cx('iconSuccess')} />
                    ) : (
                      <Circle size={20} className={cx('iconPending')} />
                    )}
                  </div>
                  <div className={cx('taskContent')}>
                    <span className={cx('taskName')}>{task.title}</span>
                    <span className={cx('taskTag', task.priority)}>
                      {task.priority}
                    </span>
                  </div>
                  <button className={cx('actionBtn')}>Start</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cột Phải: Upcoming */}
        <div className={cx('rightColumn')}>
          <div className={cx('card', 'upcomingCard')}>
            <div className={cx('cardHeader')}>
              <h3 className={cx('cardTitle')}>Sắp đến hạn</h3>
              {/* Đã import MoreHorizontal ở trên nên dòng này sẽ chạy tốt */}
              <MoreHorizontal size={20} className={cx('moreIcon')} />
            </div>

            <div className={cx('upcomingList')}>
              {upcomingTasks.map((task) => {
                const day = task.dueDate.split('-')[2];
                return (
                  <div key={task.id} className={cx('upcomingItem')}>
                    <div className={cx('dateBox')}>
                      <span className={cx('day')}>{day}</span>
                      <span className={cx('month')}>Th11</span>
                    </div>
                    <div className={cx('info')}>
                      <span className={cx('upName')}>{task.title}</span>
                      <div className={cx('meta')}>
                        <Clock size={14} /> <span>2 ngày nữa</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty State / Add Action */}
            <div className={cx('viewCalendarBtn')}>
              <CalendarDays size={18} />
              <span>Xem toàn bộ lịch biểu</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
