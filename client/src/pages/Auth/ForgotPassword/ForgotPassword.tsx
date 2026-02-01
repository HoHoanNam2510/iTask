/* client/src/pages/Auth/ForgotPassword.tsx */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import axios from 'axios';
import { ArrowLeft, Mail } from 'lucide-react';

import images from '~/assets/images';
import styles from '../Auth.module.scss';

// Tái sử dụng hình nền giống Login/Register
const bgImage = images.general.todolist;
const cx = classNames.bind(styles);

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert('Vui lòng nhập địa chỉ email!');
      return;
    }

    try {
      setIsLoading(true);
      // Gọi API Backend (Logic này sẽ được viết ở bước sau)
      const res = await axios.post(
        'http://localhost:5000/api/auth/forgot-password',
        {
          email,
        }
      );

      if (res.data.success) {
        setIsSuccess(true);
      }
    } catch (error: any) {
      console.error('Forgot Password Error:', error);
      const msg =
        error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
      alert(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cx('wrapper')}>
      {/* Cột trái: Form */}
      <div className={cx('leftColumn')}>
        <div className={cx('formCard')}>
          {/* Nút quay lại */}
          <Link to="/login" className={cx('backToLogin')}>
            <ArrowLeft size={18} />
            <span>Back to Login</span>
          </Link>

          {!isSuccess ? (
            <>
              <h1 className={cx('title')}>Forgot Password?</h1>
              <p className={cx('subtitle')}>
                Don't worry! It happens. Please enter the email associated with
                your account.
              </p>

              <form onSubmit={handleSubmit}>
                <div className={cx('inputGroup')}>
                  <label className={cx('label')}>Email address</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className={cx('input')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className={cx('submitBtn')}
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Code'}
                </button>
              </form>
            </>
          ) : (
            // Giao diện khi gửi thành công
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  margin: '0 auto 2rem',
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#dcfce7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Mail size={32} color="#16a34a" />
              </div>
              <h2 className={cx('title')}>Check your email</h2>
              <p className={cx('subtitle')} style={{ marginBottom: '2rem' }}>
                We sent a password reset link to <strong>{email}</strong>
              </p>
              <p className={cx('footerText')}>
                Didn't receive the email?{' '}
                <button
                  onClick={handleSubmit}
                  className={cx('link')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                  }}
                  disabled={isLoading}
                >
                  Click to resend
                </button>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cột phải: Hình ảnh */}
      <div className={cx('rightColumn')}>
        <img src={bgImage} alt="Background" className={cx('authImage')} />
      </div>
    </div>
  );
};

export default ForgotPassword;
