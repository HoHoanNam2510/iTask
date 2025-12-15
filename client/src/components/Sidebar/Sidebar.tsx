import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import {
  LayoutDashboard,
  Zap,
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
} from 'lucide-react';
import styles from './Sidebar.module.scss';
import { useAuth } from '~/context/AuthContext';
import GroupModal from '~/components/GroupModal/GroupModal';
const cx = classNames.bind(styles);

interface SidebarProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  // [MỚI] Thêm prop này để nhận hàm từ Layout
  onToggle?: () => void;
}

// ... (Phần Interface Group và MOCK_GROUPS giữ nguyên) ...
interface Group {
  id: string;
  name: string;
  memberCount: number;
}
const MOCK_GROUPS: Group[] = [
  { id: 'dev-team', name: 'Dev Team Frontend', memberCount: 5 },
  { id: 'marketing', name: 'Marketing Campaign', memberCount: 8 },
  { id: 'study', name: 'English Class', memberCount: 12 },
];

const Sidebar = ({ onToggle }: { onToggle?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // 2. Lấy state từ Context
  const { isAuthenticated, user, logout } = useAuth();
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  // 3. Định nghĩa menu: Thêm cờ 'public'
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, public: true },
    { path: '/vital-task', label: 'Vital Task', icon: Zap, public: false },
    { path: '/my-task', label: 'My Task', icon: CheckSquare, public: false },
    {
      path: '/task-categories',
      label: 'Task Categories',
      icon: List,
      public: false,
    },
    { path: '/calendar', label: 'Calendar', icon: Calendar, public: false },
    { path: '/settings', label: 'Settings', icon: Settings, public: false },
    { path: '/help', label: 'Help', icon: HelpCircle, public: false },
  ];

  // Hàm xử lý khi click vào menu item
  const handleItemClick = (e: React.MouseEvent, item: any) => {
    // Nếu chưa login và item KHÔNG public -> Chặn luôn
    if (!isAuthenticated && !item.public) {
      e.preventDefault();
      alert('Vui lòng đăng nhập để sử dụng tính năng này!');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // [MỚI] Hàm helper để xử lý đường dẫn ảnh
  const getAvatarUrl = (avatarPath: string) => {
    if (!avatarPath) return '';
    // Nếu là link online (http) hoặc blob (preview) thì giữ nguyên
    if (avatarPath.startsWith('http') || avatarPath.startsWith('blob:')) {
      return avatarPath;
    }
    // Nếu là đường dẫn file từ backend -> Nối domain + sửa dấu gạch chéo
    return `http://localhost:5000/${avatarPath.replace(/\\/g, '/')}`;
  };

  return (
    <div className={cx('sidebar')}>
      <button
        className={cx('collapseBtn')}
        onClick={onToggle}
        title="Thu gọn Sidebar"
      >
        <ChevronLeft size={20} />
      </button>

      {/* User Profile */}
      <div className={cx('profile')}>
        <div className={cx('avatar')}>
          {isAuthenticated && user?.avatar ? (
            <img
              // 👇 SỬA DÒNG NÀY: Dùng hàm helper để lấy link ảnh chuẩn
              src={getAvatarUrl(user.avatar)}
              alt={user.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} // Thêm style cho đẹp
            />
          ) : (
            <div className={cx('avatar-placeholder')}>
              {/* Thêm check user?.name để tránh lỗi charAt nếu name rỗng */}
              {isAuthenticated
                ? (user?.name || 'U').charAt(0).toUpperCase()
                : 'G'}
            </div>
          )}
        </div>

        <h3 className={cx('name')}>{isAuthenticated ? user?.name : 'Khách'}</h3>
        <p className={cx('email')}>
          {isAuthenticated ? user?.email : 'Chưa đăng nhập'}
        </p>
      </div>

      {/* Navigation Menu */}
      <nav className={cx('menu')}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          // Logic kiểm tra để disable
          const isDisabled = !isAuthenticated && !item.public;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={(e) => handleItemClick(e, item)}
              className={cx('menu-item', {
                active: location.pathname === item.path,
                // Thêm class disabled để CSS làm mờ đi
                disabled: isDisabled,
              })}
              style={isDisabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              <Icon size={20} />
              <span>{item.label}</span>
              {/* Hiện icon ổ khóa nếu bị khóa */}
              {isDisabled && <Lock size={14} style={{ marginLeft: 'auto' }} />}
            </Link>
          );
        })}

        {/* Group Section - Chỉ hiện khi đã login */}
        {isAuthenticated && (
          <div className={cx('group-section')}>
            <div className={cx('group-label')}>
              <span>GROUPS</span>
              {/* ... */}
            </div>
            {/* ... Render Groups ... */}
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

      {/* Nút Login / Logout thay đổi tùy trạng thái */}
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
      />
    </div>
  );
};

export default Sidebar;
