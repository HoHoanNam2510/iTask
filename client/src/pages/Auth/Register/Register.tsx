import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';

import images from '~/assets/images';
import styles from '../Auth.module.scss';

// Vẫn dùng chung ảnh nền lá cây để tạo sự đồng bộ,
// hoặc bạn có thể đổi ảnh khác nếu muốn
const registerBg = images.general.todolist;

const cx = classNames.bind(styles);

const Register: React.FC = () => {
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // Giả lập đăng ký thành công -> chuyển về trang login
    // Hoặc có thể tự động login luôn tùy logic của bạn
    navigate('/login');
  };

  return (
    <div className={cx('wrapper')}>
      {/* CỘT TRÁI: FORM */}
      <div className={cx('leftColumn')}>
        <div className={cx('formCard')}>
          {/* Title */}
          <h1 className={cx('title')}>Get Started Now</h1>
          {/* Trang Register trong ảnh không có subtitle nên mình bỏ qua */}

          <form onSubmit={handleRegister} style={{ marginTop: '3rem' }}>
            {/* Name Field */}
            <div className={cx('inputGroup')}>
              <label className={cx('label')}>Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                className={cx('input')}
              />
            </div>

            {/* Email Field */}
            <div className={cx('inputGroup')}>
              <label className={cx('label')}>Email address</label>
              <input
                type="email"
                placeholder="Enter your email"
                className={cx('input')}
              />
            </div>

            {/* Password Field */}
            <div className={cx('inputGroup')}>
              <label className={cx('label')}>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                className={cx('input')}
              />
            </div>

            {/* Terms Checkbox */}
            {/* Tái sử dụng class formOptions nhưng chỉnh style inline một chút để căn trái */}
            <div
              className={cx('formOptions')}
              style={{ justifyContent: 'flex-start' }}
            >
              <label className={cx('rememberMe')}>
                <input type="checkbox" required />
                <span className={cx('termsText')}>
                  I agree to the
                  <Link to="/terms">terms & policy</Link>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button type="submit" className={cx('submitBtn')}>
              Signup
            </button>
          </form>

          {/* Divider */}
          <div className={cx('divider')}>
            <span>Or</span>
          </div>

          {/* Social Buttons */}
          <div className={cx('socialButtons')}>
            <button className={cx('socialBtn')}>
              <FcGoogle />
              Sign in with Google
            </button>
            <button className={cx('socialBtn')}>
              <FaFacebook style={{ color: '#1877F2' }} />
              Sign in with Facebook
            </button>
          </div>

          {/* Footer - Link về Login */}
          <p className={cx('footerText')}>
            Have an account?
            <Link to="/login" className={cx('link')}>
              Sign In
            </Link>
          </p>
        </div>
      </div>

      {/* CỘT PHẢI: HÌNH ẢNH */}
      <div className={cx('rightColumn')}>
        {/* Quay lại dùng thẻ img để trình duyệt tự tính tỷ lệ */}
        <img
          src={registerBg}
          alt="Login Background"
          className={cx('authImage')}
        />
      </div>
    </div>
  );
};

export default Register;
