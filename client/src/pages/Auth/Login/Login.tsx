import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { FcGoogle } from 'react-icons/fc'; // Icon Google có màu sẵn
import { FaFacebook } from 'react-icons/fa'; // Icon Facebook

import images from '~/assets/images';

import styles from '../Auth.module.scss';
// Đổi đường dẫn ảnh này thành ảnh thực tế trong dự án của bạn
// Ví dụ: import loginBg from '~/assets/images/leaf-bg.jpg';
// Tạm thời mình dùng link ảnh online để bạn thấy demo ngay
const loginBg = images.general.todolist;
const cx = classNames.bind(styles);

const Login: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Fake logic đăng nhập
    localStorage.setItem('isLoggedIn', 'true');
    navigate('/');
  };

  return (
    <div className={cx('wrapper')}>
      {/* CỘT TRÁI: FORM */}
      <div className={cx('leftColumn')}>
        <div className={cx('formCard')}>
          <h1 className={cx('title')}>Welcome back!</h1>
          <p className={cx('subtitle')}>
            Enter your Credentials to access your account
          </p>

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div className={cx('inputGroup')}>
              <label className={cx('label')}>Email address</label>
              <input
                type="email"
                placeholder="Enter your email"
                className={cx('input')}
              />
            </div>

            {/* Password */}
            <div className={cx('inputGroup')}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className={cx('label')}>Password</label>
              </div>
              <input
                type="password"
                placeholder="Enter your password"
                className={cx('input')}
              />
            </div>

            {/* Remember & Forgot */}
            <div className={cx('formOptions')}>
              <label className={cx('rememberMe')}>
                <input type="checkbox" />
                Remember for 30 days
              </label>
              <Link to="/forgot-password" className={cx('forgotPassword')}>
                Forgot password
              </Link>
            </div>

            {/* Submit Button */}
            <button type="submit" className={cx('submitBtn')}>
              Login
            </button>
          </form>

          {/* Divider */}
          <div className={cx('divider')}>
            <span>Or</span>
          </div>

          {/* Social Buttons: Google & Facebook */}
          <div className={cx('socialButtons')}>
            <button className={cx('socialBtn')}>
              <FcGoogle />
              Sign in with Google
            </button>
            <button className={cx('socialBtn')}>
              <FaFacebook style={{ color: '#1877F2' }} />{' '}
              {/* Màu xanh đặc trưng Facebook */}
              Sign in with Facebook
            </button>
          </div>

          {/* Sign Up Link */}
          <p className={cx('footerText')}>
            Don't have an account?
            <Link to="/register" className={cx('link')}>
              Sign Up
            </Link>
          </p>
        </div>
      </div>

      {/* CỘT PHẢI: HÌNH ẢNH */}
      <div className={cx('rightColumn')}>
        {/* Quay lại dùng thẻ img để trình duyệt tự tính tỷ lệ */}
        <img src={loginBg} alt="Login Background" className={cx('authImage')} />
      </div>
    </div>
  );
};

export default Login;
