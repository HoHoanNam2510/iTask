import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Settings,
  CheckCircle2,
  ChevronDown, // Import thêm icon
} from 'lucide-react';
import styles from './Footer.module.scss';

// Thêm prop onToggle
interface FooterProps {
  totalTasks?: number;
  completedTasks?: number;
  onToggle?: () => void; // Hàm để báo lên Layout là muốn ẩn đi
}

const Footer: React.FC<FooterProps> = ({
  totalTasks = 10,
  completedTasks = 7,
  onToggle,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const progressPercentage =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <footer className={styles.footerContainer}>
      {/* Nút Ẩn Footer (Collapse) - Đặt tuyệt đối hoặc ngay đầu */}
      <button
        onClick={onToggle}
        title="Ẩn thanh điều hướng"
        className={styles.collapseBtn} // Sẽ thêm style ở bước sau
      >
        <ChevronDown size={18} />
      </button>

      {/* --- Phần Status --- */}
      <div className={styles.statusSection}>
        <div className={styles.progressInfo}>
          <CheckCircle2 size={20} className={styles.iconSuccess} />
          <span className={styles.statusText}>
            Đã xong{' '}
            <strong>
              {completedTasks}/{totalTasks}
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

      {/* --- Phần Navigation --- */}
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
