/* client/src/pages/Admin/CategoryManagement/CategoryManagement.tsx */
import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import {
  Trash2,
  Search,
  Tag,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Edit2,
} from 'lucide-react';
import httpRequest from '~/utils/httpRequest';
import styles from './CategoryManagement.module.scss';
import Pagination from '~/components/Pagination/Pagination';
import CategoryModal from '~/components/Modals/CategoryModal/CategoryModal';
import { getImageUrl } from '~/utils/imageHelper'; // 👇 [MỚI] Import helper

const cx = classNames.bind(styles);

interface ICreator {
  _id: string;
  username: string;
  avatar?: string;
  email: string;
}
interface ICategory {
  _id: string;
  name: string;
  description?: string;
  color: string;
  createdBy: ICreator;
  createdAt: string;
}

const CategoryManagement = () => {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<ICategory | null>(null);

  // States: Filter, Sort, Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCategories, setTotalCategories] = useState(0);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'createdAt', direction: 'desc' });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await httpRequest.get('/api/categories/admin/all', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          limit,
          search: searchTerm,
          sortBy: sortConfig.key,
          order: sortConfig.direction,
        },
      });

      if (res.data.success) {
        setCategories(res.data.categories);
        setTotalPages(res.data.totalPages);
        setTotalCategories(res.data.total);
      }
    } catch (error) {
      console.error('Lỗi tải categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCategories();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [page, limit, searchTerm, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const renderSortIcon = (key: string) => {
    if (sortConfig.key !== key)
      return <ArrowUpDown size={14} color="#BFC9D1" />;
    return sortConfig.direction === 'asc' ? (
      <ArrowUp size={14} color="#EAEFEF" />
    ) : (
      <ArrowDown size={14} color="#EAEFEF" />
    );
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
      const token = localStorage.getItem('token');
      await httpRequest.delete(`/api/categories/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCategories();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Xóa thất bại');
    }
  };

  const handleEdit = (category: ICategory) => {
    setCategoryToEdit(category);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (formData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (categoryToEdit) {
        // Edit Mode
        await httpRequest.put(
          `/api/categories/admin/${categoryToEdit._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create Mode (Admin có thể tạo nhưng ở đây tập trung Edit)
        // await httpRequest.post(...)
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      alert('Lỗi cập nhật danh mục');
    }
  };

  return (
    <div className={cx('wrapper')}>
      <div className={cx('header')}>
        <div className={cx('headerLeft')}>
          <h1 className={cx('title')}>
            Category Management{' '}
            <span className={cx('countBadge')}>{totalCategories}</span>
          </h1>
        </div>
        <div className={cx('toolbar')}>
          <div style={{ position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: 10,
                top: 10,
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              placeholder="Search category name..."
              className={cx('searchInput')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      <div className={cx('tableContainer')}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
        ) : (
          <table className={cx('categoryTable')}>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')}>
                  <div className={cx('thContent')}>
                    NAME {renderSortIcon('name')}
                  </div>
                </th>
                <th>DESCRIPTION</th>
                <th>COLOR</th>
                <th onClick={() => handleSort('createdAt')}>
                  <div className={cx('thContent')}>
                    CREATED AT {renderSortIcon('createdAt')}
                  </div>
                </th>
                <th>CREATOR</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id}>
                  <td>
                    <div className={cx('catName')}>
                      <Tag size={16} color={cat.color} />
                      {cat.name}
                    </div>
                  </td>
                  <td>{cat.description || '-'}</td>
                  <td>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        background: cat.color,
                        borderRadius: 6,
                        border: '1px solid #e2e8f0',
                      }}
                    ></div>
                  </td>
                  <td>{new Date(cat.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <div className={cx('creatorInfo')}>
                      {/* 👇 [ĐÃ SỬA] Dùng getImageUrl */}
                      {cat.createdBy?.avatar ? (
                        <img
                          src={getImageUrl(cat.createdBy.avatar)}
                          alt="avatar"
                          className={cx('avatar')}
                        />
                      ) : (
                        <div className={cx('avatarPlaceholder')}>
                          {cat.createdBy?.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className={cx('textInfo')}>
                        <span className={cx('username')}>
                          {cat.createdBy?.username || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={cx('actionCell')}>
                      <button
                        className={cx('actionBtn', 'edit')}
                        onClick={() => handleEdit(cat)}
                        title="Sửa danh mục"
                      >
                        <Edit2 size={18} color="#3b82f6" />
                      </button>
                      <button
                        className={cx('deleteBtn')}
                        onClick={() => handleDelete(cat._id)}
                        title="Xóa danh mục"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalCategories}
        limit={limit}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />

      {/* Modal cho Admin Edit */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={
          categoryToEdit
            ? {
                name: categoryToEdit.name,
                description: categoryToEdit.description || '',
                color: categoryToEdit.color,
              }
            : null
        }
        title="Admin: Chỉnh sửa Danh mục"
      />
    </div>
  );
};

export default CategoryManagement;
