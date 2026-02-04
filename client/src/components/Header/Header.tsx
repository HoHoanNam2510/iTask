/* src/components/Layout/Header/Header.tsx */
import classNames from 'classnames/bind';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  Search,
  Bell,
  CalendarDays,
  CheckSquare,
  Trash2,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import styles from './Header.module.scss';
import useDebounce from '~/hooks/useDebounce';
import httpRequest from '~/utils/httpRequest';

const cx = classNames.bind(styles);

// Interface cho Notification
interface INotification {
  _id: string;
  text: string;
  type: string;
  link?: string;
  isRead: boolean;
  sender: {
    username: string;
    avatar?: string;
  };
  createdAt: string;
}

// Interface cho kết quả search
interface SearchResult {
  _id: string;
  title: string;
  status: string;
  group?: {
    _id: string;
    name: string;
  };
}

const Header = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showNoti, setShowNoti] = useState(false);
  // [ĐÃ XÓA] showCalendar state thừa
  const [now, setNow] = useState(new Date());

  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // State Search
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Áp dụng Debounce
  const debouncedQuery = useDebounce(query, 1000);

  const notiRef = useRef<HTMLDivElement | null>(null);
  const calRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLFormElement | null>(null);

  // Hàm gọi API lấy thông báo
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await httpRequest.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setNotifications(res.data.notifications);
        const unread = res.data.notifications.filter(
          (n: any) => !n.isRead
        ).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Lỗi tải thông báo');
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchSearch = async () => {
      if (!debouncedQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const token = localStorage.getItem('token');
        const res = await httpRequest.get(
          `/api/tasks/search?q=${encodeURIComponent(debouncedQuery)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.data.success) {
          setSearchResults(res.data.tasks);
          setShowSearchResults(true);
        }
      } catch (error) {
        console.error('Search error', error);
      } finally {
        setIsSearching(false);
      }
    };

    fetchSearch();
  }, [debouncedQuery]);

  // Handle click ra ngoài
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (notiRef.current && !notiRef.current.contains(e.target as Node))
        setShowNoti(false);
      // [ĐÃ SỬA] Bỏ logic setShowCalendar vì biến đã xóa, calRef chỉ dùng để navigate

      // Đóng search result
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  // Hàm xóa thông báo
  const handleDeleteNoti = async (e: React.MouseEvent, notiId: string) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc muốn xóa thông báo này?')) return;

    try {
      const token = localStorage.getItem('token');
      await httpRequest.delete(`/api/notifications/${notiId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) => prev.filter((n) => n._id !== notiId));
      const isUnread = notifications.find((n) => n._id === notiId && !n.isRead);
      if (isUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Lỗi xóa notification:', error);
    }
  };

  // Xử lý click thông báo
  const handleNotiClick = async (noti: INotification) => {
    if (!noti.isRead) {
      try {
        const token = localStorage.getItem('token');
        await httpRequest.put(
          `/api/notifications/${noti._id}/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setNotifications((prev) =>
          prev.map((n) => (n._id === noti._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error(error);
      }
    }

    setShowNoti(false);

    const taskId = noti.link;
    if (
      taskId &&
      (noti.type === 'mention' ||
        noti.type === 'assign' ||
        noti.type === 'deadline')
    ) {
      try {
        const token = localStorage.getItem('token');
        const res = await httpRequest.get(`/api/tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          const task = res.data.task;
          if (task.group) {
            const groupId =
              typeof task.group === 'object' ? task.group._id : task.group;
            navigate(`/groups/${groupId}?openTask=${task._id}`);
          } else {
            navigate(`/?openTask=${task._id}`);
          }
        }
      } catch (error) {
        console.error('Task không tồn tại:', error);
        alert('Công việc này có thể đã bị xóa.');
      }
    }
  };

  // [ĐÃ XÓA] handleSearch (không dùng)
  // [ĐÃ XÓA] formatDate (không dùng)

  const renderNotificationText = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className={cx('mentionHighlight')}>
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const handleResultClick = (task: SearchResult) => {
    setShowSearchResults(false);
    setQuery('');

    if (task.group) {
      navigate(`/groups/${task.group._id}?openTask=${task._id}`);
    } else {
      navigate(`/my-task?openTask=${task._id}`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <header className={cx('header')}>
      <div className={cx('left')} tabIndex={-1}>
        <div className={cx('logo')}>
          <Link to="/">
            <CheckSquare size={26} strokeWidth={2.5} />
            <span>iTask</span>
          </Link>
        </div>
      </div>

      <div className={cx('center')}>
        <form
          className={cx('searchBar')}
          onSubmit={handleSearchSubmit}
          ref={searchRef}
        >
          <input
            className={cx('searchInput')}
            placeholder="Tìm kiếm công việc..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value === '') setShowSearchResults(false);
            }}
            onFocus={() => {
              if (searchResults.length > 0) setShowSearchResults(true);
            }}
            spellCheck={false}
          />
          <button className={cx('searchBtn')} type="submit">
            {isSearching ? (
              <Loader2 size={18} className={cx('spin')} />
            ) : (
              <Search size={18} />
            )}
          </button>

          {showSearchResults && query && (
            <div className={cx('searchDropdown')}>
              {searchResults.length === 0 && !isSearching ? (
                <div className={cx('noResult')}>
                  Không tìm thấy công việc nào
                </div>
              ) : (
                searchResults.map((task) => (
                  <div
                    key={task._id}
                    className={cx('searchItem')}
                    onClick={() => handleResultClick(task)}
                  >
                    <div className={cx('searchInfo')}>
                      <span className={cx('searchTitle')}>{task.title}</span>
                      <span className={cx('searchGroup')}>
                        {task.group
                          ? `• Trong nhóm: ${task.group.name}`
                          : '• Công việc cá nhân'}
                      </span>
                    </div>
                    <ArrowRight size={14} className={cx('arrowIcon')} />
                  </div>
                ))
              )}
            </div>
          )}
        </form>
      </div>

      <div className={cx('right')}>
        {/* Notifications */}
        <div className={cx('iconWrapper')} ref={notiRef}>
          <button
            className={cx('iconBtn', { active: showNoti })}
            onClick={(e) => {
              e.stopPropagation();
              setShowNoti((s) => !s);
            }}
          >
            <Bell size={20} />
          </button>

          {unreadCount > 0 && (
            <span className={cx('badge')}>{unreadCount}</span>
          )}

          {showNoti && (
            <div className={cx('dropdown')}>
              <h4
                style={{
                  margin: '0 0 8px 12px',
                  fontSize: '1.6rem',
                  color: '#94a3b8',
                }}
              >
                Thông báo
              </h4>

              <div className={cx('notiList')}>
                {notifications.length === 0 ? (
                  <div
                    style={{
                      padding: 12,
                      textAlign: 'center',
                      color: '#999',
                      fontSize: '1.4rem',
                    }}
                  >
                    Không có thông báo mới
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      className={cx('dropdownItem')}
                      key={n._id}
                      onClick={() => handleNotiClick(n)}
                      style={{ opacity: n.isRead ? 0.7 : 1 }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: n.isRead
                            ? 'transparent'
                            : 'var(--primary)',
                          flexShrink: 0,
                          marginTop: 6,
                        }}
                      />

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          width: '100%',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 700 }}>
                            {n.sender?.username}{' '}
                          </span>
                          {renderNotificationText(n.text)}
                        </div>
                        <span className={cx('notiTime')}>
                          {format(new Date(n.createdAt), 'dd/MM/yyyy - HH:mm')}
                        </span>
                      </div>

                      <button
                        className={cx('deleteBtn')}
                        onClick={(e) => handleDeleteNoti(e, n._id)}
                        title="Xóa thông báo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Calendar */}
        <div className={cx('iconWrapper')} ref={calRef}>
          <button
            className={cx('iconBtn')}
            onClick={() => navigate('/calendar')}
            title="Lịch"
          >
            <CalendarDays size={20} />
          </button>
        </div>

        <div className={cx('dateText')}>{format(now, 'dd/MM/yyyy')}</div>
      </div>
    </header>
  );
};

export default Header;
