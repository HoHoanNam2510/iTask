import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';

import images from '~/assets/images';
import styles from '../Auth.module.scss';
import httpRequest from '~/utils/httpRequest';

const registerBg = images.general.todolist;
const cx = classNames.bind(styles);

const Register: React.FC = () => {
  const navigate = useNavigate();

  // 1. State cho form đăng ký
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 2. Hàm xử lý Đăng ký thật
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    try {
      setIsLoading(true);
      // Gọi API Register (Giả định route là /api/auth/register)
      const res = await httpRequest.post('/api/auth/register', {
        name,
        email,
        password,
      });

      if (res.data.success) {
        alert('Đăng ký thành công! Vui lòng đăng nhập.');
        navigate('/login'); // Chuyển về trang login
      }
    } catch (error: any) {
      console.error('Register Error:', error);
      const message = error.response?.data?.message || 'Đăng ký thất bại.';
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cx('wrapper')}>
      <div className={cx('leftColumn')}>
        <div className={cx('formCard')}>
          <h1 className={cx('title')}>Get Started Now</h1>

          <form onSubmit={handleRegister} style={{ marginTop: '3rem' }}>
            {/* Name Field */}
            <div className={cx('inputGroup')}>
              <label className={cx('label')}>Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                className={cx('input')}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Email Field */}
            <div className={cx('inputGroup')}>
              <label className={cx('label')}>Email address</label>
              <input
                type="email"
                placeholder="Enter your email"
                className={cx('input')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Field */}
            <div className={cx('inputGroup')}>
              <label className={cx('label')}>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                className={cx('input')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div
              className={cx('formOptions')}
              style={{ justifyContent: 'flex-start' }}
            >
              <label className={cx('rememberMe')}>
                <input type="checkbox" required />
                <span className={cx('termsText')}>
                  I agree to the <Link to="/terms">terms & policy</Link>
                </span>
              </label>
            </div>

            <button
              type="submit"
              className={cx('submitBtn')}
              disabled={isLoading}
            >
              {isLoading ? 'Signing up...' : 'Signup'}
            </button>
          </form>

          <div className={cx('divider')}>
            <span>Or</span>
          </div>

          <div className={cx('socialButtons')}>
            <button className={cx('socialBtn')}>
              <FcGoogle /> Sign in with Google
            </button>
            <button className={cx('socialBtn')}>
              <FaFacebook style={{ color: '#1877F2' }} /> Sign in with Facebook
            </button>
          </div>

          <p className={cx('footerText')}>
            Have an account?{' '}
            <Link to="/login" className={cx('link')}>
              Sign In
            </Link>
          </p>
        </div>
      </div>

      <div className={cx('rightColumn')}>
        <img
          src={registerBg}
          alt="Register Background"
          className={cx('authImage')}
        />
      </div>
    </div>
  );
};

export default Register;
