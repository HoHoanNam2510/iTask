import { NavLink, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '~/context/AuthContext';
import styles from './AdminSidebar.module.scss';

const cx = classNames.bind(styles);

const AdminSidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Tổng quan' },
    { path: '/admin/users', icon: <Users size={20} />, label: 'Quản lý Users' },
    { path: '/admin/settings', icon: <Settings size={20} />, label: 'Cài đặt' },
  ];

  return (
    <aside className={cx('wrapper')}>
      {/* Header Sidebar */}
      <div className={cx('header')}>
        <ShieldCheck size={28} className={cx('logoIcon')} />
        <span className={cx('logoText')}>iTask Admin</span>
      </div>

      {/* Menu List */}
      <nav className={cx('nav')}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) => cx('navItem', { active: isActive })}
          >
            <span className={cx('icon')}>{item.icon}</span>
            <span className={cx('label')}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Sidebar */}
      <div className={cx('footer')}>
        <button className={cx('logoutBtn')} onClick={handleLogout}>
          <LogOut size={20} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
