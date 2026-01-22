import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import { X } from 'lucide-react';
import styles from './CategoryModal.module.scss';

const cx = classNames.bind(styles);

interface CategoryData {
  name: string;
  description: string;
  color: string;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryData) => Promise<void>; // Parent handle API logic
  initialData?: CategoryData | null; // Dữ liệu để edit (nếu có)
  title?: string;
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title,
}) => {
  const [formData, setFormData] = useState<CategoryData>({
    name: '',
    description: '',
    color: '#40a578',
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load data khi mở modal để Edit
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        // Reset form khi tạo mới
        setFormData({ name: '', description: '', color: '#40a578' });
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên danh mục');
      return;
    }
    try {
      setIsLoading(true);
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={cx('overlay')} onClick={onClose}>
      <div className={cx('modal')} onClick={(e) => e.stopPropagation()}>
        <div className={cx('header')}>
          <h3>
            {title ||
              (initialData ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới')}
          </h3>
          <button className={cx('closeBtn')} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={cx('body')}>
          <div className={cx('formGroup')}>
            <label>Tên danh mục</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ví dụ: Marketing, Design..."
              spellCheck={false}
              disabled={isLoading}
            />
          </div>
          <div className={cx('formGroup')}>
            <label>Mô tả ngắn</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Mô tả danh mục này..."
              spellCheck={false}
              disabled={isLoading}
            />
          </div>
          <div className={cx('formGroup')}>
            <label>Màu đại diện</label>
            <div className={cx('colorPicker')}>
              {[
                '#40a578',
                '#3b82f6',
                '#f59e0b',
                '#ef4444',
                '#8b5cf6',
                '#ec4899',
              ].map((color) => (
                <div
                  key={color}
                  className={cx('colorCircle', {
                    active: formData.color === color,
                  })}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>
        </div>

        <div className={cx('footer')}>
          <button
            className={cx('btnCancel')}
            onClick={onClose}
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            className={cx('btnSave')}
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Tạo mới'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;
