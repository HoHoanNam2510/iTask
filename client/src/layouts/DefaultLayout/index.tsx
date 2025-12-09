/* src/layouts/DefaultLayout/DefaultLayout.tsx */
import React, { useState } from 'react';
import classNames from 'classnames/bind';
import { ChevronUp, ChevronRight } from 'lucide-react'; // Import thêm ChevronRight cho Sidebar

import Footer from '~/components/Footer/Footer';
import Header from '~/components/Header/Header';
import Sidebar from '~/components/Sidebar/Sidebar';
import styles from './DefaultLayout.module.scss';

const cx = classNames.bind(styles);

interface DefaultLayoutProps {
  children: React.ReactNode;
}

const DefaultLayout: React.FC<DefaultLayoutProps> = ({ children }) => {
  // State quản lý hiển thị
  const [showFooter, setShowFooter] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true); // [MỚI] State cho Sidebar

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* 1. Header */}
      <div style={{ flexShrink: 0 }}>
        <Header />
      </div>

      {/* 2. Container chính (Chứa Sidebar + Content) */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* --- [LOGIC SIDEBAR] --- */}
        {showSidebar ? (
          // Nếu Sidebar đang mở -> Render Sidebar
          // Bạn cần sửa component Sidebar để nhận prop onToggle={...} và gắn vào nút Close bên trong nó
          <Sidebar
            // @ts-ignore: Tạm thời bỏ qua lỗi TS nếu Sidebar chưa khai báo prop này
            onToggle={() => setShowSidebar(false)}
          />
        ) : (
          // Nếu Sidebar đang đóng -> Render nút mở lại (nằm dọc bên trái)
          <div
            className={cx('restoreSidebarBtn')}
            onClick={() => setShowSidebar(true)}
            title="Mở thanh menu"
          >
            <ChevronRight size={16} />
          </div>
        )}

        {/* --- Main Content Area --- */}
        <div
          style={{
            flex: 1, // Tự động chiếm hết không gian còn lại (khi mất Sidebar sẽ tự phình to)
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease', // Thêm hiệu ứng mượt nếu muốn
          }}
        >
          {/* Content của Page (Group, Dashboard,...) */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden', // Quan trọng: đè scroll của con
              position: 'relative',
            }}
          >
            {/* Lưu ý: Group page đã có 'margin: 0 auto' và 'max-width: 1200px'.
               Nên khi container này to ra, Group page vẫn đứng giữa màn hình 
               và giữ nguyên tỷ lệ, chỉ có khoảng trắng 2 bên là rộng thêm. -> ĐÚNG YÊU CẦU.
            */}
            <div style={{ width: '100%', height: '100%' }}>{children}</div>
          </div>

          {/* Footer Area */}
          {showFooter ? (
            <div style={{ flexShrink: 0, marginTop: 0 }}>
              <Footer onToggle={() => setShowFooter(false)} />
            </div>
          ) : (
            /* Nút mở lại Footer */
            <div
              className={cx('restoreFooterBtn')}
              onClick={() => setShowFooter(true)}
              title="Mở thanh điều hướng"
            >
              <ChevronUp size={16} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DefaultLayout;
