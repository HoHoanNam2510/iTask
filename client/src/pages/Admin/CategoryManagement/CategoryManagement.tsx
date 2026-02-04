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
  const [totalCategories, setTotalCategories] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
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
    const timeoutId = setTimeout(() => {
      fetchCategories();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [page, limit, sortConfig, searchTerm]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
    setPage(1);
  };

  const renderSortIcon = (key: string) => {
    if (sortConfig.key !== key)
      return <ArrowUpDown size={14} color="#94a3b8" />;
    return sortConfig.direction === 'asc' ? (
      <ArrowUp size={14} color="#3b82f6" />
    ) : (
      <ArrowDown size={14} color="#3b82f6" />
    );
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa Danh mục này?')) return;
    try {
      const token = localStorage.getItem('token');
      await httpRequest.delete(`/api/categories/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCategories();
      alert('Đã xóa thành công!');
    } catch (error) {
      alert('Xóa thất bại');
    }
  };

  const handleEdit = (category: ICategory) => {
    setCategoryToEdit(category);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: any) => {
    if (!categoryToEdit) return;
    const token = localStorage.getItem('token');
    try {
      await httpRequest.put(`/api/categories/${categoryToEdit._id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCategories();
      alert('Cập nhật thành công!');
    } catch (error) {
      alert('Lỗi cập nhật');
    }
  };

  return (
    <div className={cx('wrapper')}>
      <header className={cx('header')}>
        <div className={cx('headerLeft')}>
          <h1 className={cx('title')}>
            Quản lý Danh mục{' '}
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
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className={cx('searchInput')}
            />
          </div>
        </div>
      </header>

      <div className={cx('tableContainer')}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', fontSize: '1.4rem' }}>
            Loading Categories...
          </div>
        ) : (
          <table className={cx('categoryTable')}>
            <thead>
              <tr>
                <th
                  className={cx('thSortable')}
                  onClick={() => handleSort('name')}
                >
                  <div className={cx('headerContent')}>
                    Category Name {renderSortIcon('name')}
                  </div>
                </th>
                <th>Color</th>
                <th>Creator (Owner)</th>
                <th
                  className={cx('thSortable')}
                  onClick={() => handleSort('createdAt')}
                >
                  <div className={cx('headerContent')}>
                    Created At {renderSortIcon('createdAt')}
                  </div>
                </th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id}>
                  <td>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          fontWeight: 600,
                        }}
                      >
                        <Tag size={16} color={cat.color} />
                        <span style={{ fontSize: '1.5rem' }}>{cat.name}</span>
                      </div>
                      {cat.description && (
                        <div className={cx('descriptionBadge')}>
                          {cat.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={cx('colorSwatch')}>
                      <div
                        className={cx('circle')}
                        style={{ backgroundColor: cat.color }}
                      ></div>
                      <span className={cx('hexCode')}>{cat.color}</span>
                    </div>
                  </td>
                  <td>
                    <div className={cx('creatorInfo')}>
                      {cat.createdBy?.avatar ? (
                        <img
                          src={`/${cat.createdBy.avatar.replace(/\\/g, '/')}`}
                          alt="avt"
                        />
                      ) : (
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: '#eee',
                          }}
                        />
                      )}
                      <span>{cat.createdBy?.username || 'Unknown'}</span>
                    </div>
                  </td>
                  <td>{new Date(cat.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className={cx('actionBtn')} // [FIX] Sử dụng class có sẵn trong CategoryManagement.module.scss nếu bạn đã thêm, hoặc dùng deleteBtn tạm
                        onClick={() => handleEdit(cat)}
                        title="Sửa danh mục"
                        style={{
                          // Style inline tạm để giống nút Edit bên Task nếu chưa có class
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                        }}
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
        // 👇 [FIX] Transform data để khớp với interface CategoryData của Modal
        initialData={
          categoryToEdit
            ? {
                name: categoryToEdit.name,
                description: categoryToEdit.description || '', // Fix: Fallback chuỗi rỗng
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
