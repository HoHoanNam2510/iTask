import classNames from 'classnames/bind';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Search, Bell, CalendarDays, CheckSquare } from 'lucide-react'; // Import icon từ lucide-react
import styles from './header.module.scss';

const cx = classNames.bind(styles);

const Header = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showNoti, setShowNoti] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [now, setNow] = useState(new Date());

  // Mock data
  const [notifications] = useState([
    { id: '1', text: 'Deadline task A in 1 hour' },
    { id: '2', text: 'Task B assigned to you' },
    { id: '3', text: 'Meeting with team at 2 PM' },
  ]);

  const notiRef = useRef<HTMLDivElement | null>(null);
  const calRef = useRef<HTMLDivElement | null>(null);

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

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      navigate(`/?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const formatDate = (date: Date) => {
    // Format ngắn gọn hơn một chút để đỡ tốn diện tích
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <header className={cx('header')}>
      {/* 1. Logo Section */}
      <div className={cx('left')}>
        <div className={cx('logo')}>
          <Link to="/">
            <CheckSquare size={26} strokeWidth={2.5} />
            <span>iTask</span>
          </Link>
        </div>
      </div>

      {/* 2. Search Section */}
      <div className={cx('center')}>
        <form className={cx('searchBar')} onSubmit={handleSearch}>
          <input
            className={cx('searchInput')}
            placeholder="Tìm kiếm tác vụ..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className={cx('searchBtn')} type="submit">
            <Search size={18} />
          </button>
        </form>
      </div>

      {/* 3. Actions Section */}
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

          {notifications.length > 0 && (
            <span className={cx('badge')}>{notifications.length}</span>
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
              {notifications.map((n) => (
                <div className={cx('dropdownItem')} key={n.id}>
                  {n.text}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Calendar Quick View */}
        <div className={cx('iconWrapper')} ref={calRef}>
          <button
            className={cx('iconBtn', { active: showCalendar })}
            onClick={(e) => {
              e.stopPropagation();
              setShowCalendar((s) => !s);
            }}
          >
            <CalendarDays size={20} />
          </button>

          {showCalendar && (
            <div className={cx('dropdown')}>
              <div className={cx('dropdownItem')}>
                Hôm nay: {formatDate(now)}
              </div>
              <div className={cx('dropdownItem')}>
                <Link to="/calendar">Xem toàn bộ lịch</Link>
              </div>
            </div>
          )}
        </div>

        {/* Date Display */}
        <div className={cx('dateText')}>{formatDate(now)}</div>
      </div>
    </header>
  );
};

export default Header;
