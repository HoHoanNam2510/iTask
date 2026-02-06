/* client/src/pages/Auth/ForgotPassword.tsx */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { ArrowLeft, Mail } from 'lucide-react';

import images from '~/assets/images';
import styles from '../Auth.module.scss';
import httpRequest from '~/utils/httpRequest';

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
      // Gọi đúng endpoint đã khai báo trong userRoutes
      const res = await httpRequest.post('/api/users/forgot-password', {
        email,
      });

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
      <div className={cx('leftColumn')}>
        <div className={cx('contentBox')}>
          <Link to="/login" className={cx('backLink')}>
            <ArrowLeft size={20} /> Back to Login
          </Link>

          {!isSuccess ? (
            <>
              <h2 className={cx('title')}>Forgot Password?</h2>
              <p className={cx('subtitle')}>
                Enter your email address and we'll send you a link to reset your
                password.
              </p>

              <form onSubmit={handleSubmit} className={cx('form')}>
                <div className={cx('inputGroup')}>
                  <label className={cx('label')}>Email Address</label>
                  <div className={cx('inputWithIcon')}>
                    <Mail size={20} className={cx('icon')} />
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className={cx('input')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={cx('submitBtn')}
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div
                style={{
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

      <div className={cx('rightColumn')}>
        <img src={bgImage} alt="Background" className={cx('authImage')} />
      </div>
    </div>
  );
};

export default ForgotPassword;
