import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames/bind';
import { Camera, Save, User, Palette, Mail } from 'lucide-react';
import axios from 'axios';

import styles from './Setting.module.scss';
import { useAuth } from '~/context/AuthContext';
import { useTheme, THEMES } from '~/context/ThemeContext'; // Import Context vừa tạo

const cx = classNames.bind(styles);

const Setting = () => {
  const { user, login } = useAuth(); // Lấy user và hàm login để update lại context sau khi sửa
  const { color: currentColor, changeTheme } = useTheme();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Load dữ liệu user ban đầu
  useEffect(() => {
    if (user) {
      setName(user.username || ''); // Fallback về chuỗi rỗng nếu user.name null
      if (user.avatar) setAvatarPreview(user.avatar);
    }
  }, [user]);

  // Xử lý chọn ảnh
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
      setAvatarFile(file);
    }
  };

  // Xử lý Lưu thông tin cá nhân
  /* src/pages/Setting/Setting.tsx */

  // ... (các đoạn code trên giữ nguyên)

  // Xử lý Lưu thông tin cá nhân
  const handleSaveProfile = async () => {
    if (!name.trim()) return alert('Tên không được để trống');

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      // ... (đoạn FormData giữ nguyên)

      // 1. Tạo FormData chuẩn của trình duyệt
      const formData = new FormData();
      formData.append('name', name);

      // Chỉ append file nếu người dùng có chọn file mới
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      // Log ra console trình duyệt để chắc chắn data đúng trước khi gửi
      // Lưu ý: console.log(formData) sẽ thấy rỗng, phải dùng for...of để log
      for (const pair of formData.entries()) {
        console.log('Frontend gửi:', pair[0], pair[1]);
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

        // 👇 [SỬA ĐOẠN NÀY QUAN TRỌNG] 👇

        // Backend có thể trả về user thiếu trường 'role', dẫn đến việc bị AdminRoute đá ra ngoài.
        // Giải pháp: Merge thông tin cũ (có role) với thông tin mới trả về.
        const updatedUser = {
          ...user, // Lấy toàn bộ info cũ (bao gồm role: 'admin')
          ...res.data.user, // Ghi đè info mới (name, avatar) lên
        };

        // Cập nhật lại Context với user đầy đủ quyền
        login(token!, updatedUser);

        // 👆 [HẾT PHẦN SỬA] 👆
      }
    } catch (error) {
      console.error('Lỗi update:', error);
      alert('Cập nhật thất bại.');
    } finally {
      setIsLoading(false);
    }
  };

  // ... (phần return giữ nguyên)

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
            {/* Avatar Upload */}
            <div className={cx('avatarSection')}>
              <div
                className={cx('avatarWrapper')}
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <img
                    src={
                      // Nếu là ảnh vừa chọn từ máy (blob:...) thì giữ nguyên
                      avatarPreview.startsWith('blob:')
                        ? avatarPreview
                        : // Nếu là ảnh từ DB:
                        // 1. Thay thế dấu '\' thành '/' (để sửa lỗi đường dẫn Windows cũ)
                        // 2. Nếu đường dẫn chưa có http, thì nối thêm vào
                        avatarPreview.startsWith('http')
                        ? avatarPreview
                        : `http://localhost:5000/${avatarPreview.replace(
                            /\\/g,
                            '/'
                          )}`
                    }
                    alt="Avatar"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div className={cx('avatarPlaceholder')}>
                    {/* --- SỬA DÒNG DƯỚI ĐÂY --- */}
                    {(name || 'U').charAt(0).toUpperCase()}
                    {/* Fallback về 'U' (User) nếu name bị rỗng/undefined */}
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

            {/* Form Inputs */}
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

        {/* SECTION 2: APPEARANCE / THEME */}
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
                  onClick={() => changeTheme(theme.value)}
                >
                  <div
                    className={cx('colorCircle')}
                    style={{ backgroundColor: theme.value }}
                  />
                  <span className={cx('themeName')}>{theme.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Setting;
