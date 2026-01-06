/* src/components/Layout/Header/Header.tsx */
import classNames from 'classnames/bind';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
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

const cx = classNames.bind(styles);

// Interface cho Notification
interface INotification {
  _id: string;
  text: string;
  type: string;
  link?: string; // 👈 [MỚI] Thêm trường link (chứa taskId)
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
  const [showCalendar, setShowCalendar] = useState(false); // Vẫn giữ state để tránh lỗi logic cũ
  const [now, setNow] = useState(new Date());

  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 👇 [STATE MỚI] Cho Search
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Áp dụng Debounce 1000ms (1 giây)
  const debouncedQuery = useDebounce(query, 1000);

  const notiRef = useRef<HTMLDivElement | null>(null);
  const calRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLFormElement | null>(null); // Ref cho vùng search

  // Hàm gọi API lấy thông báo
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await axios.get('http://localhost:5000/api/notifications', {
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
    const onDoc = (e: MouseEvent) => {
      if (notiRef.current && !notiRef.current.contains(e.target as Node)) {
        setShowNoti(false);
      }
      if (calRef.current && !calRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  // 👇 [MỚI] Effect xử lý gọi API Search khi debouncedQuery thay đổi
  useEffect(() => {
    const fetchSearch = async () => {
      if (!debouncedQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(
          `http://localhost:5000/api/tasks/search?q=${encodeURIComponent(
            debouncedQuery
          )}`,
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

  // Handle click ra ngoài để đóng dropdown search
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (notiRef.current && !notiRef.current.contains(e.target as Node))
        setShowNoti(false);
      if (calRef.current && !calRef.current.contains(e.target as Node))
        setShowCalendar(false);

      // Đóng search result
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  // 👇 [MỚI] Hàm xóa thông báo
  const handleDeleteNoti = async (e: React.MouseEvent, notiId: string) => {
    e.stopPropagation(); // Ngăn click lan ra ngoài
    if (!window.confirm('Bạn có chắc muốn xóa thông báo này?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/notifications/${notiId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update UI
      setNotifications((prev) => prev.filter((n) => n._id !== notiId));
      // Nếu xóa thông báo chưa đọc thì giảm count
      const isUnread = notifications.find((n) => n._id === notiId && !n.isRead);
      if (isUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Lỗi xóa notification:', error);
    }
  };

  // 👇 [CẬP NHẬT] Xử lý click thông báo -> Đánh dấu đọc & Điều hướng
  const handleNotiClick = async (noti: INotification) => {
    // 1. Đánh dấu đã đọc
    if (!noti.isRead) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(
          `http://localhost:5000/api/notifications/${noti._id}/read`,
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

    setShowNoti(false); // Đóng dropdown

    // 2. Logic điều hướng Deep Link
    // Giả sử noti.link chứa taskId
    const taskId = noti.link;
    if (
      taskId &&
      (noti.type === 'mention' ||
        noti.type === 'assign' ||
        noti.type === 'deadline')
    ) {
      try {
        // Gọi API lấy thông tin task để biết nó thuộc Group nào
        const token = localStorage.getItem('token');
        const res = await axios.get(
          `http://localhost:5000/api/tasks/${taskId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.data.success) {
          const task = res.data.task;
          if (task.group) {
            // 👇 [SỬA] Kiểm tra nếu group là object (đã populate) thì lấy _id, ngược lại giữ nguyên
            const groupId =
              typeof task.group === 'object' ? task.group._id : task.group;

            // Navigate với ID chuẩn
            navigate(`/groups/${groupId}?openTask=${task._id}`);
          } else {
            // Nếu là task cá nhân -> Qua Dashboard (hoặc MyTask)
            navigate(`/?openTask=${task._id}`);
          }
        }
      } catch (error) {
        console.error('Task không tồn tại:', error);
        alert('Công việc này có thể đã bị xóa.');
      }
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      navigate(`/?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }).format(date);
  };

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

  // 👇 [MỚI] Xử lý khi click vào kết quả tìm kiếm
  const handleResultClick = (task: SearchResult) => {
    setShowSearchResults(false);
    setQuery('');

    if (task.group) {
      // Nếu thuộc nhóm -> Vào trang Group Detail
      navigate(`/groups/${task.group._id}?openTask=${task._id}`);
    } else {
      // Nếu là task cá nhân -> Vào trang My Task
      navigate(`/my-task?openTask=${task._id}`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Nếu user nhấn Enter mà chưa có kết quả load xong, có thể force search hoặc bỏ qua
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

          {/* 👇 DROPDOWN KẾT QUẢ TÌM KIẾM */}
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
                      onClick={() => handleNotiClick(n)} // Gọi hàm click mới
                      style={{ opacity: n.isRead ? 0.7 : 1 }}
                    >
                      {/* Chấm trạng thái */}
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

                      {/* 👇 [MỚI] Nút xóa */}
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
        {/* 👇 [ĐÃ SỬA] Click vào đây để điều hướng trang Calendar */}
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
