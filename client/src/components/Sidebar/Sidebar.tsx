/* src/components/Layout/Sidebar/Sidebar.tsx */
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  Hash,
  ChevronLeft, // [MỚI] Import icon mũi tên trái để làm nút đóng
} from 'lucide-react';
import styles from './Sidebar.module.scss';
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

const Sidebar = ({ user, onToggle }: SidebarProps) => {
  // Destructuring thêm onToggle
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/vital-task', label: 'Vital Task', icon: Zap },
    { path: '/my-task', label: 'My Task', icon: CheckSquare },
    { path: '/task-categories', label: 'Task Categories', icon: List },
    { path: '/calendar', label: 'Calendar', icon: Calendar },
    { path: '/settings', label: 'Settings', icon: Settings },
    { path: '/help', label: 'Help', icon: HelpCircle },
  ];

  const isActive = (path: string) => location.pathname === path;
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  return (
    <div className={cx('sidebar')}>
      {/* --- [MỚI] Nút Collapse nằm góc trên phải --- */}
      <button
        className={cx('collapseBtn')}
        onClick={onToggle}
        title="Thu gọn Sidebar"
      >
        <ChevronLeft size={20} />
      </button>

      {/* User Profile Section */}
      <div className={cx('profile')}>
        {/* ... Code cũ giữ nguyên ... */}
        <div className={cx('avatar')}>
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} />
          ) : (
            <div className={cx('avatar-placeholder')}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <h3 className={cx('name')}>{user?.name || 'Guest User'}</h3>
        <p className={cx('email')}>{user?.email || 'guest@example.com'}</p>
      </div>

      {/* Navigation Menu */}
      <nav className={cx('menu')}>
        {/* ... Code cũ giữ nguyên ... */}
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cx('menu-item', { active: isActive(item.path) })}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className={cx('group-section')}>
          {/* ... Code cũ giữ nguyên ... */}
          <div className={cx('group-label')}>
            <span>GROUPS</span>
            <span className={cx('badge')}>{MOCK_GROUPS.length}</span>
          </div>

          {MOCK_GROUPS.map((group) => (
            <Link
              key={group.id}
              to={`/groups/${group.id}`}
              className={cx('menu-item', 'group-item', {
                active: isActive(`/groups/${group.id}`),
              })}
            >
              <Hash size={18} className={cx('group-icon')} />
              <span className={cx('group-name')}>{group.name}</span>
            </Link>
          ))}

          <button
            className={cx('add-group-btn')}
            onClick={() => setIsGroupModalOpen(true)}
          >
            <PlusCircle size={18} />
            <span>Join or Create Group</span>
          </button>
        </div>
      </nav>

      {/* Logout Button */}
      <button className={cx('logout')}>
        <LogOut size={20} />
        <span>Logout</span>
      </button>

      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
      />
    </div>
  );
};

export default Sidebar;
