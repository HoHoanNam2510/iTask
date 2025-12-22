import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import axios from 'axios';
import { Trash2, Search, Tag } from 'lucide-react';
import styles from './CategoryManagement.module.scss';

const cx = classNames.bind(styles);

// Interface cho User (Creator)
interface ICreator {
  _id: string;
  username: string;
  avatar?: string;
  email: string;
}

// Interface cho Category
interface ICategory {
  _id: string;
  name: string;
  description?: string;
  color: string; // Mã màu hex (vd: #ff0000)
  createdBy: ICreator; // ⚠️ Chú ý: Backend trả về 'owner' hay 'creator' thì sửa ở đây cho khớp
  createdAt: string;
}

const CategoryManagement = () => {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch API
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        'http://localhost:5000/api/categories/admin/all',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data.success) {
        setCategories(res.data.categories);
      }
    } catch (error) {
      console.error('Lỗi tải categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa Danh mục này?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/categories/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(categories.filter((c) => c._id !== id));
      alert('Đã xóa thành công!');
    } catch (error) {
      alert('Xóa thất bại');
    }
  };

  // Filter
  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.createdBy?.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading)
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        Loading Categories...
      </div>
    );

  return (
    <div className={cx('wrapper')}>
      <header className={cx('header')}>
        <h1 className={cx('title')}>
          Quản lý Danh mục{' '}
          <span className={cx('countBadge')}>{categories.length}</span>
        </h1>

        {/* Search Bar */}
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
            placeholder="Tìm danh mục hoặc người tạo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '10px 10px 10px 36px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              outline: 'none',
              minWidth: 300,
            }}
          />
        </div>
      </header>

      <div className={cx('tableContainer')}>
        <table className={cx('categoryTable')}>
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Color</th>
              <th>Creator (Owner)</th>
              <th>Created At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.map((cat) => (
              <tr key={cat._id}>
                <td>
                  {/* Wrapper để xếp Name và Description theo chiều dọc */}
                  <div
                    style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
                  >
                    {/* Dòng 1: Icon + Tên Category */}
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

                    {/* 👇 [MỚI] Dòng 2: Description (Chỉ hiện nếu có dữ liệu) */}
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
                        src={`http://localhost:5000/${cat.createdBy.avatar.replace(
                          /\\/g,
                          '/'
                        )}`}
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
                  <button
                    className={cx('deleteBtn')}
                    onClick={() => handleDelete(cat._id)}
                    title="Xóa danh mục"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryManagement;
