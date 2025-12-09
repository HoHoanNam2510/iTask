import React, { useState } from 'react';
import classNames from 'classnames/bind';
import { Plus, Edit2, Trash2, X, FolderKanban, LayoutGrid } from 'lucide-react';
import styles from './TaskCategories.module.scss';

const cx = classNames.bind(styles);

// --- Mock Data Ban Đầu ---
const initialCategories = [
  {
    id: '1',
    name: 'Work Project',
    taskCount: 12,
    color: '#40a578',
    description: 'Các dự án công ty và họp hành',
  },
  {
    id: '2',
    name: 'Personal',
    taskCount: 5,
    color: '#3b82f6',
    description: 'Việc cá nhân, gia đình',
  },
  {
    id: '3',
    name: 'Shopping',
    taskCount: 2,
    color: '#f59e0b',
    description: 'Danh sách đồ cần mua',
  },
  {
    id: '4',
    name: 'Health',
    taskCount: 3,
    color: '#ef4444',
    description: 'Lịch tập gym, khám sức khỏe',
  },
];

const TaskCategories = () => {
  const [categories, setCategories] = useState(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State cho Form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#40a578',
  });

  // --- Handlers ---

  // 1. Mở Modal để Thêm mới
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', color: '#40a578' });
    setIsModalOpen(true);
  };

  // 2. Mở Modal để Sửa
  const handleOpenEdit = (category: (typeof initialCategories)[0]) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description,
      color: category.color,
    });
    setIsModalOpen(true);
  };

  // 3. Xử lý Lưu (Create hoặc Update)
  const handleSave = () => {
    if (!formData.name.trim()) return; // Validate cơ bản

    if (editingId) {
      // Logic Update
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === editingId ? { ...cat, ...formData } : cat
        )
      );
    } else {
      // Logic Create
      const newCat = {
        id: Date.now().toString(),
        taskCount: 0,
        ...formData,
      };
      setCategories([...categories, newCat]);
    }
    setIsModalOpen(false);
  };

  // 4. Xử lý Xóa
  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa danh mục này?')) {
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    }
  };

  return (
    <div className={cx('wrapper')}>
      {/* Header */}
      <header className={cx('header')}>
        <div>
          <h1 className={cx('title')}>Task Categories</h1>
          <p className={cx('subtitle')}>Quản lý các nhóm công việc của bạn</p>
        </div>
        <button className={cx('addBtn')} onClick={handleOpenAdd}>
          <Plus size={20} />
          <span>Thêm danh mục</span>
        </button>
      </header>

      {/* Grid Categories */}
      <div className={cx('gridContainer')}>
        {categories.map((cat) => (
          <div key={cat.id} className={cx('card')}>
            <div className={cx('cardHeader')}>
              <div
                className={cx('iconBox')}
                style={{ backgroundColor: `${cat.color}20`, color: cat.color }} // Màu nền nhạt 20% opacity
              >
                <FolderKanban size={24} />
              </div>
              <div className={cx('actions')}>
                <button
                  className={cx('actionBtn')}
                  onClick={() => handleOpenEdit(cat)}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className={cx('actionBtn', 'delete')}
                  onClick={() => handleDelete(cat.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <h3 className={cx('catName')}>{cat.name}</h3>
            <p className={cx('catDesc')}>
              {cat.description || 'Không có mô tả'}
            </p>

            <div className={cx('catFooter')}>
              <div className={cx('taskBadge')}>
                <LayoutGrid size={14} />
                <span>{cat.taskCount} tasks</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL / POPUP */}
      {isModalOpen && (
        <div className={cx('modalOverlay')}>
          <div className={cx('modalContent')}>
            <div className={cx('modalHeader')}>
              <h3>{editingId ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className={cx('modalBody')}>
              <div className={cx('formGroup')}>
                <label>Tên danh mục</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ví dụ: Công việc, Gia đình..."
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
                  placeholder="Mô tả mục đích..."
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

            <div className={cx('modalFooter')}>
              <button
                className={cx('btnCancel')}
                onClick={() => setIsModalOpen(false)}
              >
                Hủy
              </button>
              <button className={cx('btnSave')} onClick={handleSave}>
                {editingId ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCategories;
