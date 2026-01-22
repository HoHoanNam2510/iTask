import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import { X } from 'lucide-react';
import axios from 'axios';
import styles from './UserModal.module.scss';

const cx = classNames.bind(styles);

interface IUser {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: IUser | null; // User cần edit
}

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
}) => {
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setRole(user.role);
      setUsername(user.username);
    }
  }, [user, isOpen]);

  const handleSubmit = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/users/${user._id}/admin`, // API dành riêng cho Admin update user
        { role, username },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Cập nhật thành công!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Cập nhật thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className={cx('overlay')} onClick={onClose}>
      <div className={cx('modal')} onClick={(e) => e.stopPropagation()}>
        <div className={cx('header')}>
          <h3>Chỉnh sửa người dùng</h3>
          <button className={cx('closeBtn')} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={cx('body')}>
          <div className={cx('formGroup')}>
            <label>Email (Không thể thay đổi)</label>
            <input type="text" value={user.email} disabled />
          </div>

          <div className={cx('formGroup')}>
            <label>Tên hiển thị</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className={cx('formGroup')}>
            <label>Vai trò (Role)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
            >
              <option value="user">User (Người dùng)</option>
              <option value="admin">Admin (Quản trị viên)</option>
            </select>
          </div>
        </div>

        <div className={cx('footer')}>
          <button className={cx('btnCancel')} onClick={onClose}>
            Hủy
          </button>
          <button
            className={cx('btnSave')}
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserModal;
