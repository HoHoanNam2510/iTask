/* client/src/pages/Admin/FeedbackManagement/FeedbackManagement.tsx */
import { useEffect, useState } from 'react';
import axios from 'axios';
import classNames from 'classnames/bind';
import { Search, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import styles from './FeedbackManagement.module.scss';
import Pagination from '~/components/Pagination/Pagination';

const cx = classNames.bind(styles);

const FeedbackManagement = () => {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // 👇 [MỚI] Sort Config
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'createdAt', direction: 'desc' });

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        'http://localhost:5000/api/feedbacks/admin/all',
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page,
            limit,
            search,
            status: statusFilter,
            // 👇 Gửi params sort lên server
            sortBy: sortConfig.key,
            order: sortConfig.direction,
          },
        }
      );
      if (res.data.success) {
        setFeedbacks(res.data.feedbacks);
        setTotalItems(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchFeedbacks(), 300);
    return () => clearTimeout(timer);
  }, [page, limit, search, statusFilter, sortConfig]); // Thêm sortConfig vào dep

  // 👇 [MỚI] Hàm xử lý Sort
  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
    setPage(1); // Reset về trang 1 khi sort
  };

  // 👇 [MỚI] Render icon sort
  const renderSortIcon = (key: string) => {
    if (sortConfig.key !== key)
      return <ArrowUpDown size={14} color="#94a3b8" />;
    return sortConfig.direction === 'asc' ? (
      <ArrowUp size={14} color="#3b82f6" />
    ) : (
      <ArrowDown size={14} color="#3b82f6" />
    );
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      // Cập nhật UI ngay lập tức cho mượt (Optimistic Update)
      setFeedbacks((prev) =>
        prev.map((fb) => (fb._id === id ? { ...fb, status: newStatus } : fb))
      );

      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/feedbacks/admin/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // fetchFeedbacks(); // Không cần fetch lại để tránh giật, vì đã update UI rồi
    } catch (e) {
      alert('Lỗi cập nhật');
      fetchFeedbacks(); // Revert nếu lỗi
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa phản hồi này?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/feedbacks/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchFeedbacks();
    } catch (e) {
      alert('Lỗi xóa');
    }
  };

  return (
    <div className={cx('wrapper')}>
      <div className={cx('header')}>
        <h1 className={cx('title')}>
          Quản lý Phản hồi{' '}
          <span className={cx('countBadge')}>{totalItems}</span>
        </h1>
        <div className={cx('toolbar')}>
          <select
            className={cx('selectInput')}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="reviewing">Đang xem xét</option>
            <option value="resolved">Đã giải quyết</option>
          </select>

          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 10,
                top: 12,
                color: '#94a3b8',
              }}
            />
            <input
              className={cx('searchInput')}
              style={{ paddingLeft: 34 }}
              placeholder="Tìm kiếm nội dung..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      <div className={cx('tableContainer')}>
        <table className={cx('feedbackTable')}>
          <thead>
            <tr>
              <th>Người gửi</th>
              {/* 👇 Header Sortable */}
              <th
                className={cx('thSortable')}
                onClick={() => handleSort('type')}
              >
                <div className={cx('headerContent')}>
                  Loại & Tiêu đề {renderSortIcon('type')}
                </div>
              </th>
              <th style={{ width: '40%' }}>Nội dung</th>
              <th
                className={cx('thSortable')}
                onClick={() => handleSort('status')}
              >
                <div className={cx('headerContent')}>
                  Trạng thái {renderSortIcon('status')}
                </div>
              </th>
              <th
                className={cx('thSortable')}
                onClick={() => handleSort('createdAt')}
              >
                <div className={cx('headerContent')}>
                  Ngày gửi {renderSortIcon('createdAt')}
                </div>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>
                  Loading...
                </td>
              </tr>
            ) : (
              feedbacks.map((fb) => (
                <tr key={fb._id}>
                  <td>
                    <div className={cx('userInfo')}>
                      <span>{fb.user?.username || 'Unknown'}</span>
                      <small>{fb.user?.email}</small>
                    </div>
                  </td>
                  <td>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <span className={cx('typeBadge', fb.type)}>
                        {fb.type}
                      </span>
                      <span style={{ fontWeight: 500 }}>{fb.subject}</span>
                    </div>
                  </td>
                  <td>{fb.message}</td>
                  <td>
                    {/* 👇 [MỚI] Dropdown đổi trạng thái trực tiếp */}
                    <select
                      className={cx('statusSelect', fb.status)}
                      value={fb.status}
                      onChange={(e) =>
                        handleUpdateStatus(fb._id, e.target.value)
                      }
                    >
                      <option value="pending">PENDING</option>
                      <option value="reviewing">REVIEWING</option>
                      <option value="resolved">RESOLVED</option>
                    </select>
                  </td>
                  <td>{new Date(fb.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className={cx('actionBtn', 'delete')}
                        onClick={() => handleDelete(fb._id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />
    </div>
  );
};

export default FeedbackManagement;
