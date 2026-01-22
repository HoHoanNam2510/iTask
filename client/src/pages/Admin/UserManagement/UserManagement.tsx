/* client/src/pages/Admin/UserManagement/UserManagement.tsx */
import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import axios from 'axios';
import {
  Trash2,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Edit2,
} from 'lucide-react';

import styles from './UserManagement.module.scss';
import { useAuth } from '~/context/AuthContext';
import Pagination from '~/components/Pagination/Pagination';
import UserModal from '~/components/Modals/UserModal/UserModal'; // Import Modal

const cx = classNames.bind(styles);

interface IUser {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  password?: string;
  avatar?: string;
  createdAt: string;
}

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<IUser | null>(null);

  // States: Filter, Sort, Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'createdAt', direction: 'desc' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          limit,
          search: searchTerm,
          sortBy: sortConfig.key,
          order: sortConfig.direction,
        },
      });
      if (res.data.success) {
        setUsers(res.data.users);
        setTotalPages(res.data.totalPages);
        setTotalUsers(res.data.total);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [page, limit, sortConfig, searchTerm]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
    setPage(1);
  };

  const renderSortIcon = (key: string) => {
    if (sortConfig.key !== key)
      return <ArrowUpDown size={14} color="#94a3b8" />;
    return sortConfig.direction === 'asc' ? (
      <ArrowUp size={14} color="#3b82f6" />
    ) : (
      <ArrowDown size={14} color="#3b82f6" />
    );
  };

  const handleDelete = async (userId: string) => {
    if (userId === currentUser?._id) {
      alert('Bạn không thể tự xóa chính mình!');
      return;
    }
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
      alert('Đã xóa thành công!');
    } catch (error) {
      alert('Xóa thất bại.');
    }
  };

  const handleEdit = (user: IUser) => {
    if (user._id === currentUser?._id) {
      // Tùy chọn: Có cho phép admin tự sửa quyền mình không? Thường là không nên ở đây.
      alert('Vui lòng vào trang Settings để sửa thông tin cá nhân.');
      return;
    }
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  return (
    <div className={cx('wrapper')}>
      <header className={cx('header')}>
        <div className={cx('headerLeft')}>
          <h1 className={cx('title')}>
            Quản lý Users <span className={cx('countBadge')}>{totalUsers}</span>
          </h1>
        </div>
        <div className={cx('toolbar')}>
          <div style={{ position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: 10,
                top: 10,
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className={cx('searchInput')}
            />
          </div>
        </div>
      </header>

      <div className={cx('tableContainer')}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', fontSize: '1.4rem' }}>
            Loading Users...
          </div>
        ) : (
          <table className={cx('userTable')}>
            <thead>
              <tr>
                <th
                  className={cx('thSortable')}
                  onClick={() => handleSort('username')}
                >
                  <div className={cx('headerContent')}>
                    Username {renderSortIcon('username')}
                  </div>
                </th>
                <th
                  className={cx('thSortable')}
                  onClick={() => handleSort('email')}
                >
                  <div className={cx('headerContent')}>
                    Email {renderSortIcon('email')}
                  </div>
                </th>
                <th
                  className={cx('thSortable')}
                  onClick={() => handleSort('role')}
                >
                  <div className={cx('headerContent')}>
                    Role {renderSortIcon('role')}
                  </div>
                </th>
                <th>Password</th>
                <th
                  className={cx('thSortable')}
                  onClick={() => handleSort('createdAt')}
                >
                  <div className={cx('headerContent')}>
                    Created At {renderSortIcon('createdAt')}
                  </div>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className={cx('userInfo')}>
                      {u.avatar ? (
                        <img
                          src={`http://localhost:5000/${u.avatar.replace(/\\/g, '/')}`}
                          alt="avatar"
                          className={cx('avatar')}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              'none';
                          }}
                        />
                      ) : (
                        <div className={cx('avatarPlaceholder')}>
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{u.username}</span>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={cx('roleBadge', u.role)}>{u.role}</span>
                  </td>
                  <td>
                    <div className={cx('passwordCell')} title={u.password}>
                      {u.password || 'N/A'}
                    </div>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {u._id !== currentUser?._id && (
                        <>
                          <button
                            className={cx('deleteBtn')}
                            style={{
                              color: '#3b82f6',
                              borderColor: 'transparent',
                            }}
                            onClick={() => handleEdit(u)}
                            title="Sửa User"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            className={cx('deleteBtn')}
                            onClick={() => handleDelete(u._id)}
                            title="Xóa người dùng"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalUsers}
        limit={limit}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />

      {/* Modal Admin Edit User */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchUsers();
        }}
        user={userToEdit}
      />
    </div>
  );
};

export default UserManagement;
