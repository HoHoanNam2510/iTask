import React, { useState, useEffect } from 'react';
import axios from 'axios';
import classNames from 'classnames/bind';
import { Plus, Edit2, Trash2, X, FolderKanban, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './TaskCategories.module.scss';

const cx = classNames.bind(styles);

// Interface khớp với Backend
interface Category {
  _id: string;
  name: string;
  description: string;
  color: string;
  taskCount?: number; // Backend đã trả về cái này rồi!
}

const TaskCategories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // State cho Form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#40a578',
  });

  // --- 1. Fetch Data từ API ---
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data.categories || []);
    } catch (error) {
      console.error('Lỗi tải danh mục:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // --- Handlers ---

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', color: '#40a578' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingId(category._id);
    setFormData({
      name: category.name,
      description: category.description,
      color: category.color,
    });
    setIsModalOpen(true);
  };

  // --- 2. Xử lý Lưu (Create / Update) ---
  const handleSave = async () => {
    if (!formData.name.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (editingId) {
        // --- UPDATE ---
        await axios.put(
          `http://localhost:5000/api/categories/${editingId}`,
          formData,
          { headers }
        );
      } else {
        // --- CREATE ---
        await axios.post('http://localhost:5000/api/categories', formData, {
          headers,
        });
      }

      // Reload lại danh sách sau khi lưu thành công
      fetchCategories();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Lỗi lưu danh mục:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại.');
    }
  };

  // --- 3. Xử lý Xóa ---
  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa danh mục này?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/categories/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Cập nhật UI ngay lập tức
        setCategories((prev) => prev.filter((cat) => cat._id !== id));
      } catch (error) {
        console.error('Lỗi xóa danh mục:', error);
        alert('Không thể xóa danh mục này.');
      }
    }
  };

  // Hàm xử lý khi click vào card
  const handleCardClick = (id: string) => {
    navigate(`/task-categories/${id}`);
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
      {isLoading ? (
        <p style={{ padding: 20 }}>Đang tải...</p>
      ) : (
        <div className={cx('gridContainer')}>
          {categories.map((cat) => (
            <div
              key={cat._id}
              className={cx('card')}
              onClick={() => handleCardClick(cat._id)}
              style={{ cursor: 'pointer' }}
            >
              <div className={cx('cardHeader')}>
                <div
                  className={cx('iconBox')}
                  style={{
                    backgroundColor: `${cat.color}20`,
                    color: cat.color,
                  }}
                >
                  <FolderKanban size={24} />
                </div>
                <div className={cx('actions')}>
                  {/* --- SỬA NÚT EDIT --- */}
                  <button
                    className={cx('actionBtn')}
                    onClick={(e) => {
                      e.stopPropagation(); // <--- CHẶN SỰ KIỆN LAN TRUYỀN
                      handleOpenEdit(cat);
                    }}
                  >
                    <Edit2 size={16} />
                  </button>

                  {/* --- SỬA NÚT DELETE --- */}
                  <button
                    className={cx('actionBtn', 'delete')}
                    onClick={(e) => {
                      e.stopPropagation(); // <--- CHẶN SỰ KIỆN LAN TRUYỀN
                      handleDelete(cat._id);
                    }}
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
                  {/* Bây giờ biến này đã có giá trị từ Backend */}
                  <span>{cat.taskCount || 0} tasks</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL (Giữ nguyên logic render modal cũ, chỉ thay đổi onClick save) */}
      {isModalOpen && (
        <div className={cx('modalOverlay')}>
          <div className={cx('modalContent')}>
            {/* ... (Phần UI Modal giữ nguyên như cũ) ... */}
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
                />
              </div>
              {/* Color Picker giữ nguyên */}
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
