/* src/pages/Setting/Setting.tsx */
import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames/bind';
import {
  Camera,
  Save,
  User,
  Palette,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Hash, // Icon cho ô nhập Hex
} from 'lucide-react';
import axios from 'axios';

import styles from './Setting.module.scss';
import { useAuth } from '~/context/AuthContext';
import { useTheme, THEMES } from '~/context/ThemeContext';
import { getImageUrl } from '~/utils/imageHelper'; // 👇 Import helper

const cx = classNames.bind(styles);

const Setting = () => {
  const { user, login } = useAuth();
  const { color: currentColor, changeTheme } = useTheme();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- STATE CHO PROFILE ---
  const [name, setName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // --- STATE CHO PASSWORD ---
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isPassLoading, setIsPassLoading] = useState(false);

  // --- STATE CHO MÀU TÙY CHỈNH ---
  const [customColor, setCustomColor] = useState(currentColor);

  // Sync customColor khi theme thay đổi
  useEffect(() => {
    setCustomColor(currentColor);
  }, [currentColor]);

  // Load dữ liệu user ban đầu
  useEffect(() => {
    if (user) {
      setName(user.username || '');
      // 👇 Dùng helper để lấy URL ảnh chuẩn (Cloudinary hoặc Local)
      if (user.avatar) {
        setAvatarPreview(getImageUrl(user.avatar));
      }
    }
  }, [user]);

  // Xử lý chọn ảnh (Preview local blob)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
      setAvatarFile(file);
    }
  };

  // Xử lý Lưu thông tin cá nhân
  const handleSaveProfile = async () => {
    if (!name.trim()) return alert('Tên không được để trống');

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');

      const formData = new FormData();
      formData.append('name', name);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const res = await axios.put(
        'http://localhost:5000/api/users/profile',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        alert('Cập nhật thành công!');
        const updatedUser = {
          ...user,
          ...res.data.user,
        };
        login(token!, updatedUser);
      }
    } catch (error) {
      console.error('Lỗi update:', error);
      alert('Cập nhật thất bại.');
    } finally {
      setIsLoading(false);
    }
  };

  // HÀM ĐỔI MẬT KHẨU
  const handleChangePassword = async () => {
    const { currentPassword, newPassword } = passwordData;

    if (!currentPassword || !newPassword) {
      alert('Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới');
      return;
    }

    if (newPassword.length < 6) {
      alert('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    try {
      setIsPassLoading(true);
      const token = localStorage.getItem('token');

      const res = await axios.put(
        'http://localhost:5000/api/users/change-password',
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        alert('Đổi mật khẩu thành công!');
        setPasswordData({ currentPassword: '', newPassword: '' });
      }
    } catch (error: any) {
      console.error('Lỗi đổi pass:', error);
      const msg = error.response?.data?.message || 'Đổi mật khẩu thất bại';
      alert(msg);
    } finally {
      setIsPassLoading(false);
    }
  };

  // XỬ LÝ ĐỔI MÀU TÙY CHỈNH
  const handleCustomColorChange = (newColor: string) => {
    setCustomColor(newColor);
    changeTheme(newColor);
  };

  return (
    <div className={cx('wrapper')}>
      <header className={cx('header')}>
        <h1 className={cx('title')}>Settings</h1>
        <p className={cx('subtitle')}>
          Quản lý thông tin cá nhân và giao diện ứng dụng
        </p>
      </header>

      <div className={cx('content')}>
        {/* SECTION 1: PERSONAL INFORMATION */}
        <div className={cx('card')}>
          <div className={cx('cardHeader')}>
            <User size={20} className={cx('icon')} />
            <h3>Thông tin cá nhân</h3>
          </div>

          <div className={cx('cardBody')}>
            <div className={cx('avatarSection')}>
              <div
                className={cx('avatarWrapper')}
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <img
                    // 👇 Đã được xử lý bởi getImageUrl ở useEffect hoặc Blob ở handleFileChange
                    src={avatarPreview}
                    alt="Avatar"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div className={cx('avatarPlaceholder')}>
                    {(name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className={cx('overlay')}>
                  <Camera size={24} color="white" />
                </div>
              </div>
              <input
                type="file"
                hidden
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
              />
              <p className={cx('hint')}>Nhấn vào ảnh để thay đổi</p>
            </div>

            <div className={cx('formGrid')}>
              <div className={cx('formGroup')}>
                <label>Tên hiển thị</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  spellCheck={false}
                />
              </div>

              <div className={cx('formGroup')}>
                <label>Email (Không thể thay đổi)</label>
                <div className={cx('inputWithIcon')}>
                  <Mail size={16} />
                  <input type="email" value={user?.email || ''} disabled />
                </div>
              </div>
            </div>

            <div className={cx('actionRow')}>
              <button
                className={cx('saveBtn')}
                onClick={handleSaveProfile}
                disabled={isLoading}
              >
                <Save size={18} />
                {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: SECURITY / CHANGE PASSWORD */}
        <div className={cx('card')}>
          <div className={cx('cardHeader')}>
            <Lock size={20} className={cx('icon')} />
            <h3>Bảo mật & Mật khẩu</h3>
          </div>

          <div className={cx('cardBody')}>
            <div className={cx('formGrid')}>
              {/* Mật khẩu hiện tại */}
              <div className={cx('formGroup')}>
                <label>Mật khẩu hiện tại</label>
                <div className={cx('inputWithIcon')}>
                  <Lock size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu đang dùng"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                  />
                  <div
                    className={cx('eyeIcon')}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </div>
                </div>
              </div>

              {/* Mật khẩu mới */}
              <div className={cx('formGroup')}>
                <label>Mật khẩu mới</label>
                <div className={cx('inputWithIcon')}>
                  <Lock size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu mới"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                  />
                  <div
                    className={cx('eyeIcon')}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </div>
                </div>
              </div>
            </div>

            <div className={cx('actionRow')}>
              <button
                className={cx('saveBtn')}
                onClick={handleChangePassword}
                disabled={isPassLoading}
              >
                <Save size={18} />
                {isPassLoading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 3: APPEARANCE / THEME */}
        <div className={cx('card')}>
          <div className={cx('cardHeader')}>
            <Palette size={20} className={cx('icon')} />
            <h3>Giao diện & Chủ đề</h3>
          </div>

          <div className={cx('cardBody')}>
            <p className={cx('label')}>Chọn màu chủ đạo</p>
            <div className={cx('themeGrid')}>
              {THEMES.map((theme) => (
                <div
                  key={theme.value}
                  className={cx('themeItem', {
                    active: currentColor === theme.value,
                  })}
                  onClick={() => handleCustomColorChange(theme.value)}
                >
                  <div
                    className={cx('colorCircle')}
                    style={{ backgroundColor: theme.value }}
                  />
                  <span className={cx('themeName')}>{theme.name}</span>
                </div>
              ))}
            </div>

            {/* Khu vực chọn màu tùy chỉnh */}
            <div className={cx('customThemeSection')}>
              <p className={cx('label')}>Hoặc chọn màu tùy chỉnh</p>
              <div className={cx('customColorControl')}>
                {/* 1. Color Picker Circle */}
                <div className={cx('colorPickerWrapper')}>
                  <input
                    type="color"
                    id="colorPicker"
                    value={customColor}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                  />
                  <label
                    htmlFor="colorPicker"
                    style={{ backgroundColor: customColor }}
                  />
                </div>

                {/* 2. Hex Text Input */}
                <div className={cx('inputWithIcon')}>
                  <Hash size={16} />
                  <input
                    type="text"
                    value={customColor.replace('#', '')}
                    onChange={(e) =>
                      handleCustomColorChange('#' + e.target.value)
                    }
                    maxLength={7}
                    placeholder="Mã màu (VD: 40a578)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Setting;
