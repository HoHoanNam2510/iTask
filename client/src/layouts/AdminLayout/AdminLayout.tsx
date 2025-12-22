import React from 'react';
import classNames from 'classnames/bind';
import styles from './AdminLayout.module.scss';
import AdminSidebar from '~/components/Sidebar/AdminSidebar/AdminSidebar';

const cx = classNames.bind(styles);

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className={cx('wrapper')}>
      <AdminSidebar />
      <div className={cx('container')}>
        <div className={cx('content')}>{children}</div>
      </div>
    </div>
  );
};

export default AdminLayout;
