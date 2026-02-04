import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';

// Import Context
import { useAuth } from '~/context/AuthContext';

import images from '~/assets/images';
import styles from '../Auth.module.scss';
import httpRequest from '~/utils/httpRequest';

const loginBg = images.general.todolist;
const cx = classNames.bind(styles);

const Login: React.FC = () => {
  const navigate = useNavigate();

  // Lấy hàm login từ Context
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      const res = await httpRequest.post('/api/auth/login', {
        email,
        password,
      });

      if (res.data.success) {
        const { token, user } = res.data;

        // 1. Lưu thông tin
        login(token, user);

        // 2. Thông báo (Tùy chọn)
        // alert('Đăng nhập thành công! Chào mừng quay lại.');
        // Nên bỏ alert để trải nghiệm mượt hơn, hoặc dùng thư viện Toast

        // 3. ĐIỀU HƯỚNG (Chỉ giữ lại đoạn này)
        if (user.role === 'admin') {
          console.log('👑 Admin detected -> /admin');
          navigate('/admin');
        } else {
          console.log('👤 User detected -> /');
          navigate('/');
        }

        // ❌ XÓA DÒNG navigate('/') Ở ĐÂY ĐI
      }
    } catch (error: any) {
      console.error('Login Error:', error);
      alert(error.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cx('wrapper')}>
      {/* ... Phần giao diện giữ nguyên không đổi ... */}
      <div className={cx('leftColumn')}>
        <div className={cx('formCard')}>
          <h1 className={cx('title')}>Welcome back!</h1>
          <p className={cx('subtitle')}>
            Enter your Credentials to access your account
          </p>

          <form onSubmit={handleLogin}>
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

            <div className={cx('inputGroup')}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className={cx('label')}>Password</label>
              </div>
              <input
                type="password"
                placeholder="Enter your password"
                className={cx('input')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className={cx('formOptions')}>
              <label className={cx('rememberMe')}>
                <input type="checkbox" />
                Remember for 30 days
              </label>
              <Link to="/forgot-password" className={cx('forgotPassword')}>
                Forgot password
              </Link>
            </div>

            <button
              type="submit"
              className={cx('submitBtn')}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <div className={cx('divider')}>
            <span>Or</span>
          </div>

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

          <p className={cx('footerText')}>
            Don't have an account?
            <Link to="/register" className={cx('link')}>
              Sign Up
            </Link>
          </p>
        </div>
      </div>

      <div className={cx('rightColumn')}>
        <img src={loginBg} alt="Login Background" className={cx('authImage')} />
      </div>
    </div>
  );
};

export default Login;
