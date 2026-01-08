/* client/src/components/Footer/Footer.tsx */
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { isSameDay, format } from 'date-fns';
import {
  LayoutDashboard,
  Calendar,
  Settings,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import styles from './Footer.module.scss';
import type { ITaskResponse } from '~/types/task';

interface FooterProps {
  onToggle?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
  });

  // State lưu ngày đang xem (để hiển thị text "Hôm nay" hay "Ngày ...")
  const [viewDate, setViewDate] = useState(new Date());

  // 1. Fallback: Lấy dữ liệu hôm nay khi mới vào trang (để Footer không bị trống)
  const fetchTodayInitial = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get('http://localhost:5000/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        const tasks: ITaskResponse[] = res.data.tasks;
        const today = new Date();
        const todayTasks = tasks.filter(
          (t) => t.dueDate && isSameDay(new Date(t.dueDate), today)
        );
        setStats({
          total: todayTasks.length,
          completed: todayTasks.filter((t) => t.status === 'completed').length,
        });
        setViewDate(today);
      }
    } catch (error) {
      console.error('Lỗi khởi tạo footer:', error);
    }
  };

  useEffect(() => {
    // Gọi fallback 1 lần duy nhất khi mount
    fetchTodayInitial();

    // 2. 👇 [QUAN TRỌNG] Lắng nghe sự kiện từ Dashboard để cập nhật Realtime
    const handleStatsUpdate = (event: any) => {
      const { stats, date } = event.detail;
      if (stats && date) {
        setStats({
          total: stats.total || 0,
          completed: stats.completed || 0,
        });
        setViewDate(new Date(date));
      }
    };

    window.addEventListener('ITASK_STATS_UPDATE', handleStatsUpdate);

    return () => {
      window.removeEventListener('ITASK_STATS_UPDATE', handleStatsUpdate);
    };
  }, []);

  const isActive = (path: string) => location.pathname === path;

  // Tính phần trăm
  const progressPercentage =
    stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);

  // Hiển thị Label ngày
  const dateLabel = isSameDay(viewDate, new Date())
    ? 'Hôm nay'
    : `Ngày ${format(viewDate, 'dd/MM')}`;

  return (
    <footer className={styles.footerContainer}>
      <button
        onClick={onToggle}
        title="Ẩn thanh điều hướng"
        className={styles.collapseBtn}
      >
        <ChevronDown size={18} />
      </button>

      {/* --- Status Section (Realtime Sync) --- */}
      <div className={styles.statusSection}>
        <div className={styles.progressInfo}>
          <CheckCircle2 size={20} className={styles.iconSuccess} />
          <span className={styles.statusText}>
            {dateLabel} &#x2014;{' '}
            <strong>
              {stats.completed}/{stats.total}
            </strong>
          </span>
        </div>

        <div className={styles.progressBarContainer}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* --- Navigation --- */}
      <nav className={styles.navSection}>
        <button
          className={`${styles.navItem} ${isActive('/') ? styles.active : ''}`}
          onClick={() => navigate('/')}
        >
          <LayoutDashboard size={20} />
          <span className={styles.navLabel}>Board</span>
        </button>

        <button
          className={`${styles.navItem} ${
            isActive('/calendar') ? styles.active : ''
          }`}
          onClick={() => navigate('/calendar')}
        >
          <Calendar size={20} />
          <span className={styles.navLabel}>Lịch</span>
        </button>

        <button
          className={`${styles.navItem} ${
            isActive('/settings') ? styles.active : ''
          }`}
          onClick={() => navigate('/settings')}
        >
          <Settings size={20} />
          <span className={styles.navLabel}>Cài đặt</span>
        </button>
      </nav>
    </footer>
  );
};

export default Footer;
