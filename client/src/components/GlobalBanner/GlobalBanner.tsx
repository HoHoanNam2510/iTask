/* src/components/GlobalBanner/GlobalBanner.tsx */
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Megaphone,
  X, // 👈 [MỚI] Import icon X
} from 'lucide-react';
import classNames from 'classnames/bind';
import styles from './GlobalBanner.module.scss';

const cx = classNames.bind(styles);

interface BannerConfig {
  isActive: boolean;
  content: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

const GlobalBanner = () => {
  const [config, setConfig] = useState<BannerConfig | null>(null);
  const [isVisible, setIsVisible] = useState(true); // 👈 [MỚI] State kiểm soát hiển thị

  // Hàm lấy cấu hình từ Server
  const fetchConfig = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/system');
      if (res.data.success && res.data.config) {
        setConfig(res.data.config.globalBanner);
        // Nếu nội dung thay đổi thì hiện lại banner (logic tùy chọn)
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Lỗi tải Banner hệ thống:', error);
    }
  };

  useEffect(() => {
    fetchConfig();
    const interval = setInterval(fetchConfig, 60000);
    return () => clearInterval(interval);
  }, []);

  // 👇 [SỬA] Thêm điều kiện !isVisible
  if (!isVisible || !config || !config.isActive || !config.content) return null;

  const getIcon = () => {
    switch (config.type) {
      case 'warning':
        return <AlertTriangle size={20} strokeWidth={2.5} />;
      case 'error':
        return <XCircle size={20} strokeWidth={2.5} />;
      case 'success':
        return <CheckCircle size={20} strokeWidth={2.5} />;
      default:
        return <Megaphone size={20} strokeWidth={2.5} />;
    }
  };

  return (
    <div className={cx('bannerWrapper', config.type)}>
      <div className={cx('bannerContent')}>
        {getIcon()}
        <span>{config.content}</span>
      </div>

      {/* 👇 [MỚI] Nút Đóng */}
      <button
        className={cx('closeBtn')}
        onClick={() => setIsVisible(false)}
        title="Đóng thông báo"
      >
        <X size={20} strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default GlobalBanner;
