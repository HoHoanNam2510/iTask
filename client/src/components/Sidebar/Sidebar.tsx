/* client/src/components/Sidebar/Sidebar.tsx */
import axios from 'axios';
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import {
  LayoutDashboard,
  CheckSquare,
  List,
  Calendar,
  Settings,
  HelpCircle,
  LogOut,
  PlusCircle,
  ChevronLeft,
  LogIn,
  Lock,
  Trash2,
} from 'lucide-react';
import styles from './Sidebar.module.scss';
import { useAuth } from '~/context/AuthContext';
import GroupModal from '~/components/Modals/GroupModal/GroupModal';
import { getImageUrl } from '~/utils/imageHelper'; // 👇 Import helper

const cx = classNames.bind(styles);

const Sidebar = ({ onToggle }: { onToggle?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groups, setGroups] = useState<{ _id: string; name: string }[]>([]);

  const fetchMyGroups = async () => {
    if (!isAuthenticated) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        'http://localhost:5000/api/groups/my-groups',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) setGroups(res.data.groups);
    } catch (error) {
      console.error('Lỗi sidebar', error);
    }
  };

  useEffect(() => {
    fetchMyGroups();
  }, [isAuthenticated]);

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, public: true },
    { path: '/my-task', label: 'My Task', icon: CheckSquare, public: false },
    {
      path: '/task-categories',
      label: 'Task Categories',
      icon: List,
      public: false,
    },
    { path: '/calendar', label: 'Calendar', icon: Calendar, public: false },
    { path: '/trash', label: 'Trash', icon: Trash2, public: false },
    { path: '/help', label: 'Help', icon: HelpCircle, public: false },
    { path: '/settings', label: 'Settings', icon: Settings, public: false },
  ];

  const handleItemClick = (e: React.MouseEvent, item: any) => {
    if (!isAuthenticated && !item.public) {
      e.preventDefault();
      alert('Vui lòng đăng nhập!');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={cx('sidebar')}>
      <button className={cx('collapseBtn')} onClick={onToggle}>
        <ChevronLeft size={20} />
      </button>
      <div className={cx('profile')}>
        <div className={cx('avatar')}>
          {isAuthenticated && user?.avatar ? (
            <img
              src={getImageUrl(user.avatar)} // 👇 Dùng helper
              alt={user.username}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div className={cx('avatar-placeholder')}>
              {isAuthenticated
                ? (user?.username || 'U').charAt(0).toUpperCase()
                : 'G'}
            </div>
          )}
        </div>
        <h3 className={cx('name')}>
          {isAuthenticated ? user?.username : 'Khách'}
        </h3>
        <p className={cx('email')}>
          {isAuthenticated ? user?.email : 'Chưa đăng nhập'}
        </p>
      </div>
      {/* ... Phần menu items giữ nguyên ... */}
      <nav className={cx('menu')}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isDisabled = !isAuthenticated && !item.public;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={(e) => handleItemClick(e, item)}
              className={cx('menu-item', {
                active: location.pathname === item.path,
                disabled: isDisabled,
              })}
              style={isDisabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              <Icon size={20} />
              <span>{item.label}</span>
              {isDisabled && <Lock size={14} style={{ marginLeft: 'auto' }} />}
            </Link>
          );
        })}
        {isAuthenticated && (
          <div className={cx('group-section')}>
            <div className={cx('group-label')}>
              <span>GROUPS</span>
            </div>
            <div className={cx('group-list')}>
              {groups.map((group) => (
                <Link
                  key={group._id}
                  to={`/groups/${group._id}`}
                  className={cx('menu-item', {
                    active: location.pathname === `/groups/${group._id}`,
                  })}
                >
                  <span className={cx('group-dot')}>#</span>
                  <span className={cx('group-name')}>{group.name}</span>
                </Link>
              ))}
            </div>
            <button
              className={cx('add-group-btn')}
              onClick={() => setIsGroupModalOpen(true)}
            >
              <PlusCircle size={18} />
              <span>Join or Create Group</span>
            </button>
          </div>
        )}
      </nav>
      {isAuthenticated ? (
        <button className={cx('logout')} onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      ) : (
        <Link
          to="/login"
          className={cx('logout')}
          style={{
            justifyContent: 'center',
            background: 'white',
            color: 'var(--primary)',
          }}
        >
          <LogIn size={20} />
          <span style={{ fontWeight: 'bold' }}>Login Now</span>
        </Link>
      )}
      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSuccess={fetchMyGroups}
      />
    </div>
  );
};
export default Sidebar;
