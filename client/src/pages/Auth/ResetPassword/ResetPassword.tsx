/* client/src/pages/Auth/ResetPassword.tsx */
import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import { ArrowLeft } from 'lucide-react';

import images from '~/assets/images';
import styles from '../Auth.module.scss';
import httpRequest from '~/utils/httpRequest';

const bgImage = images.general.todolist;
const cx = classNames.bind(styles);

const ResetPassword: React.FC = () => {
  const { token } = useParams(); // Lấy token từ URL
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Mật khẩu nhập lại không khớp!');
      return;
    }

    if (password.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await httpRequest.put(`/api/auth/resetpassword/${token}`, {
        password,
      });

      if (res.data.success) {
        alert('Đổi mật khẩu thành công! Hãy đăng nhập lại.');
        navigate('/login');
      }
    } catch (error: any) {
      console.error('Reset Error:', error);
      const msg =
        error.response?.data?.message || 'Link đã hết hạn hoặc không hợp lệ.';
      alert(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cx('wrapper')}>
      <div className={cx('leftColumn')}>
        <div className={cx('formCard')}>
          <Link to="/login" className={cx('backToLogin')}>
            <ArrowLeft size={18} />
            <span>Back to Login</span>
          </Link>

          <h1 className={cx('title')}>Set new password</h1>
          <p className={cx('subtitle')}>
            Your new password must be different to previously used passwords.
          </p>

          <form onSubmit={handleSubmit}>
            <div className={cx('inputGroup')}>
              <label className={cx('label')}>New Password</label>
              <div className={cx('inputWithIcon')}>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className={cx('input')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={cx('inputGroup')}>
              <label className={cx('label')}>Confirm Password</label>
              <div className={cx('inputWithIcon')}>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className={cx('input')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className={cx('submitBtn')}
              disabled={isLoading}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>

      <div className={cx('rightColumn')}>
        <img src={bgImage} alt="Background" className={cx('authImage')} />
      </div>
    </div>
  );
};

export default ResetPassword;
