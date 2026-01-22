/* client/src/pages/TaskCategories/TaskCategories.tsx */
import { useState, useEffect } from 'react';
import axios from 'axios';
import classNames from 'classnames/bind';
import { Plus, Edit2, Trash2, FolderKanban, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './TaskCategories.module.scss';
import CategoryModal from '~/components/Modals/CategoryModal/CategoryModal';

const cx = classNames.bind(styles);

interface Category {
  _id: string;
  name: string;
  description: string;
  color: string;
  taskCount?: number;
}

const TaskCategories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

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

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  // 👇 [REFACTORED] Handle Submit từ Modal
  const handleModalSubmit = async (data: any) => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    if (editingCategory) {
      // Update
      await axios.put(
        `http://localhost:5000/api/categories/${editingCategory._id}`,
        data,
        { headers }
      );
    } else {
      // Create
      await axios.post('http://localhost:5000/api/categories', data, {
        headers,
      });
    }
    fetchCategories(); // Refresh list
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa danh mục này?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/categories/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCategories((prev) => prev.filter((cat) => cat._id !== id));
      } catch (error) {
        alert('Không thể xóa danh mục này.');
      }
    }
  };

  return (
    <div className={cx('wrapper')}>
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

      {isLoading ? (
        <p style={{ padding: 20 }}>Đang tải...</p>
      ) : (
        <div className={cx('gridContainer')}>
          {categories.map((cat) => (
            <div
              key={cat._id}
              className={cx('card')}
              onClick={() => navigate(`/task-categories/${cat._id}`)}
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
                  <button
                    className={cx('actionBtn')}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(cat);
                    }}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className={cx('actionBtn', 'delete')}
                    onClick={(e) => {
                      e.stopPropagation();
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
                  <span>{cat.taskCount || 0} tasks</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 👇 Sử dụng Modal tái sử dụng */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={editingCategory}
      />
    </div>
  );
};

export default TaskCategories;
