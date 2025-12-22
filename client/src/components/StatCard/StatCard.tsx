import React from 'react';
import classNames from 'classnames/bind';
import type { LucideIcon } from 'lucide-react';
import styles from './StatCard.module.scss';

const cx = classNames.bind(styles);

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string; // Mã màu HEX (vd: #3b82f6)
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color = '#3b82f6',
}) => {
  return (
    <div className={cx('card')}>
      <div className={cx('content')}>
        <span className={cx('title')}>{title}</span>
        <h3 className={cx('value')}>{value}</h3>
      </div>
      <div className={cx('iconWrapper')} style={{ backgroundColor: color }}>
        <Icon size={24} color="#fff" />
      </div>
    </div>
  );
};

export default StatCard;
