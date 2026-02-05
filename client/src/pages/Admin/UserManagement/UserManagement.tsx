/* client/src/pages/Admin/UserManagement/UserManagement.tsx */
import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import {
  Trash2,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Edit2,
} from 'lucide-react';

import styles from './UserManagement.module.scss';
import httpRequest from '~/utils/httpRequest';
import { useAuth } from '~/context/AuthContext';
import Pagination from '~/components/Pagination/Pagination';
import UserModal from '~/components/Modals/UserModal/UserModal';
import { getImageUrl } from '~/utils/imageHelper';

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
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'createdAt', direction: 'desc' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // 👇 [QUAN TRỌNG] Gọi đúng endpoint đã khai báo trong Routes
      const res = await httpRequest.get('/api/users/admin/all', {
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
      console.error('Lỗi tải users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [page, limit, searchTerm, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const renderSortIcon = (key: string) => {
    if (sortConfig.key !== key)
      return <ArrowUpDown size={14} color="#BFC9D1" />;
    return sortConfig.direction === 'asc' ? (
      <ArrowUp size={14} color="#EAEFEF" />
    ) : (
      <ArrowDown size={14} color="#EAEFEF" />
    );
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;
    try {
      const token = localStorage.getItem('token');
      await httpRequest.delete(`/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Xóa thất bại');
    }
  };

  const handleEdit = (user: IUser) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  return (
    <div className={cx('wrapper')}>
      <div className={cx('header')}>
        <div className={cx('headerLeft')}>
          <h1 className={cx('title')}>
            User Management{' '}
            <span className={cx('countBadge')}>{totalUsers}</span>
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
                color: '#BFC9D1',
              }}
            />
            <input
              type="text"
              placeholder="Search by username or email..."
              className={cx('searchInput')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      <div className={cx('tableContainer')}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
        ) : (
          <table className={cx('userTable')}>
            <thead>
              <tr>
                <th onClick={() => handleSort('username')}>
                  <div className={cx('thContent')}>
                    USERNAME {renderSortIcon('username')}
                  </div>
                </th>
                <th onClick={() => handleSort('email')}>
                  <div className={cx('thContent')}>
                    EMAIL {renderSortIcon('email')}
                  </div>
                </th>
                <th onClick={() => handleSort('role')}>
                  <div className={cx('thContent')}>
                    ROLE {renderSortIcon('role')}
                  </div>
                </th>
                <th>PASSWORD (HASHED)</th>
                <th onClick={() => handleSort('createdAt')}>
                  <div className={cx('thContent')}>
                    JOINED DATE {renderSortIcon('createdAt')}
                  </div>
                </th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className={cx('userInfo')}>
                      {u.avatar ? (
                        <img
                          src={getImageUrl(u.avatar)}
                          alt={u.username}
                          className={cx('avatarImage')}
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
                    <span className={cx('passwordCell')}>••••••••</span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <div className={cx('actionCell')}>
                      {u._id !== currentUser?._id && (
                        <>
                          <button
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

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchUsers()}
        user={userToEdit}
      />
    </div>
  );
};

export default UserManagement;
