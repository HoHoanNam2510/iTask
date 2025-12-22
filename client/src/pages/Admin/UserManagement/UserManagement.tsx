import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import axios from 'axios';
import { Trash2 } from 'lucide-react';

import styles from './UserManagement.module.scss';
import { useAuth } from '~/context/AuthContext';

const cx = classNames.bind(styles);

// Interface khớp với dữ liệu từ Backend
interface IUser {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  password?: string; // Mật khẩu mã hóa
  avatar?: string;
  createdAt: string;
}

const UserManagement = () => {
  const { user: currentUser } = useAuth(); // Lấy user hiện tại để tránh tự xóa mình
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Gọi API lấy danh sách
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách users:', error);
      alert('Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Xử lý xóa user
  const handleDelete = async (userId: string) => {
    if (userId === currentUser?._id) {
      alert('Bạn không thể tự xóa chính mình!');
      return;
    }

    if (
      !window.confirm(
        'Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.'
      )
    )
      return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Cập nhật lại danh sách sau khi xóa
      setUsers(users.filter((u) => u._id !== userId));
      alert('Đã xóa thành công!');
    } catch (error) {
      console.error('Lỗi xóa user:', error);
      alert('Xóa thất bại.');
    }
  };

  if (loading)
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        Đang tải dữ liệu...
      </div>
    );

  return (
    <div className={cx('wrapper')}>
      <header className={cx('header')}>
        <div>
          <h1 className={cx('title')}>
            Quản lý Users{' '}
            <span className={cx('countBadge')}>{users.length}</span>
          </h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>
            Danh sách tất cả tài khoản trong hệ thống
          </p>
        </div>
        {/* Có thể thêm thanh search ở đây sau này */}
      </header>

      <div className={cx('tableContainer')}>
        <table className={cx('userTable')}>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Password</th>
              <th>Created At</th>
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
                        src={`http://localhost:5000/${u.avatar.replace(
                          /\\/g,
                          '/'
                        )}`}
                        alt="avatar"
                        className={cx('avatar')}
                        onError={(e) => {
                          // Fallback nếu ảnh lỗi
                          (e.target as HTMLImageElement).style.display = 'none';
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
                  {/* Ẩn nút xóa nếu là chính mình hoặc user đó là admin khác (tuỳ logic) */}
                  {u._id !== currentUser?._id && (
                    <button
                      className={cx('deleteBtn')}
                      onClick={() => handleDelete(u._id)}
                      title="Xóa người dùng"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
