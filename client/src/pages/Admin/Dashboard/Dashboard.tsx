import classNames from 'classnames/bind';
import { Users, CheckSquare, Layers, TrendingUp } from 'lucide-react';
import styles from './Dashboard.module.scss';
import StatCard from '~/components/StatCard/StatCard';

const cx = classNames.bind(styles);

const AdminDashboard = () => {
  return (
    <div className={cx('wrapper')}>
      <header className={cx('header')}>
        <h1 className={cx('title')}>Dashboard</h1>
        <p className={cx('subtitle')}>Chào mừng quay trở lại, Admin!</p>
      </header>

      <div className={cx('grid')}>
        <StatCard
          title="Tổng người dùng"
          value="1,240"
          icon={Users}
          color="#3b82f6"
        />
        <StatCard
          title="Tasks hoàn thành"
          value="842"
          icon={CheckSquare}
          color="#10b981"
        />
        <StatCard
          title="Nhóm hoạt động"
          value="24"
          icon={Layers}
          color="#f59e0b"
        />
        <StatCard
          title="Tăng trưởng"
          value="+18%"
          icon={TrendingUp}
          color="#8b5cf6"
        />
      </div>

      <div className={cx('section')}>
        <h2 className={cx('sectionTitle')}>Hoạt động gần đây</h2>
        <div className={cx('emptyState')}>
          <p>Chưa có dữ liệu biểu đồ...</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
