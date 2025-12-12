import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import axios from 'axios';

// [MỚI] 1. Import AuthContext
import { useAuth } from '~/context/AuthContext';

import images from '~/assets/images';
import styles from '../Auth.module.scss';

const loginBg = images.general.todolist;
const cx = classNames.bind(styles);

const Login: React.FC = () => {
  const navigate = useNavigate();

  // [MỚI] 2. Lấy hàm login từ Context
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      alert('Vui lòng nhập đầy đủ email và mật khẩu!');
      return;
    }

    try {
      setIsLoading(true);

      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email: email,
        password: password,
      });

      if (res.data.success) {
        // [QUAN TRỌNG] 3. Sử dụng hàm login của Context thay vì set localStorage thủ công
        // Hàm này sẽ tự động lưu token, user vào localStorage và cập nhật state cho Sidebar
        login(res.data.token, res.data.user);

        alert('Đăng nhập thành công!');
        navigate('/'); // Chuyển hướng về Dashboard
      }
    } catch (error: any) {
      console.error('Login Error:', error);
      const message =
        error.response?.data?.message ||
        'Đăng nhập thất bại. Vui lòng thử lại!';
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cx('wrapper')}>
      <div className={cx('leftColumn')}>
        <div className={cx('formCard')}>
          <h1 className={cx('title')}>Welcome back!</h1>
          <p className={cx('subtitle')}>
            Enter your Credentials to access your account
          </p>

          <form onSubmit={handleLogin}>
            {/* Email Input */}
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

            {/* Password Input */}
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
