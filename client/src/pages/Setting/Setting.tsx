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
  Hash,
} from 'lucide-react';

import styles from './Setting.module.scss';
import { useAuth } from '~/context/AuthContext';
import { useTheme, THEMES } from '~/context/ThemeContext';
import { getImageUrl } from '~/utils/imageHelper';
import httpRequest from '~/utils/httpRequest';

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

  useEffect(() => {
    setCustomColor(currentColor);
  }, [currentColor]);

  useEffect(() => {
    if (user) {
      setName(user.username || '');
      // Nếu chưa chọn file mới thì hiển thị avatar hiện tại từ server
      if (user.avatar && !avatarFile) {
        setAvatarPreview(getImageUrl(user.avatar));
      }
    }
  }, [user, avatarFile]); // Chạy lại khi user update (upload thành công) hoặc clear file

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url); // Preview ảnh blob local
      setAvatarFile(file);
    }
  };

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

      // Gọi API PUT với FormData.
      // Axios (sau khi fix httpRequest) sẽ tự động set Content-Type: multipart/form-data
      const res = await httpRequest.put('/api/users/profile', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        alert('Cập nhật thành công!');
        const updatedUser = {
          ...user,
          ...res.data.user, // User mới từ server (chứa link avatar Cloudinary)
        };

        // Cập nhật Context -> Sidebar và Header sẽ tự render lại ảnh mới
        login(token!, updatedUser);

        // Reset file input để chuyển về chế độ hiển thị ảnh từ server
        setAvatarFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Lỗi update:', error);
      alert('Cập nhật thất bại.');
    } finally {
      setIsLoading(false);
    }
  };

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

      const res = await httpRequest.put(
        '/api/users/change-password',
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

        {/* ... (Các phần Password và Theme giữ nguyên) */}
        <div className={cx('card')}>
          <div className={cx('cardHeader')}>
            <Lock size={20} className={cx('icon')} />
            <h3>Bảo mật & Mật khẩu</h3>
          </div>

          <div className={cx('cardBody')}>
            <div className={cx('formGrid')}>
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

            <div className={cx('customThemeSection')}>
              <p className={cx('label')}>Hoặc chọn màu tùy chỉnh</p>
              <div className={cx('customColorControl')}>
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
