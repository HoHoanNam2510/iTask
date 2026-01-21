import React from 'react';
import classNames from 'classnames/bind';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import styles from './Pagination.module.scss';

const cx = classNames.bind(styles);

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  onLimitChange,
}) => {
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className={cx('container')}>
      <div className={cx('controls')}>
        <button
          className={cx('pageBtn')}
          disabled={page === 1}
          onClick={() => onPageChange(1)}
          title="First Page"
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          className={cx('pageBtn')}
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          title="Previous Page"
        >
          <ChevronLeft size={16} />
        </button>

        {renderPageNumbers().map((p) => (
          <button
            key={p}
            className={cx('pageNumber', { active: p === page })}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}

        <button
          className={cx('pageBtn')}
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          title="Next Page"
        >
          <ChevronRight size={16} />
        </button>
        <button
          className={cx('pageBtn')}
          disabled={page === totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Last Page"
        >
          <ChevronsRight size={16} />
        </button>
      </div>

      <div className={cx('pageSize')}>
        <input
          type="number"
          min={1}
          max={100}
          value={limit}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (val > 0) onLimitChange(val);
          }}
        />
        <span>of {totalItems} items</span>
      </div>
    </div>
  );
};

export default Pagination;
