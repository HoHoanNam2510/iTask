/* client/src/pages/Admin/GroupManagement/GroupManagement.tsx */
import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import {
  Trash2,
  Search,
  LayoutGrid,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Edit2,
} from 'lucide-react';
import httpRequest from '~/utils/httpRequest';
import styles from './GroupManagement.module.scss';
import Pagination from '~/components/Pagination/Pagination';
import GroupModal from '~/components/Modals/GroupModal/GroupModal'; // Import Modal

const cx = classNames.bind(styles);

interface IMember {
  _id: string;
  username: string;
  avatar?: string;
}

interface IGroup {
  _id: string;
  name: string;
  description?: string;
  members: IMember[];
  owner: IMember;
  createdAt: string;
}

const GroupManagement = () => {
  const [groups, setGroups] = useState<IGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<IGroup | null>(null);

  // States: Filter, Sort, Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalGroups, setTotalGroups] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'createdAt', direction: 'desc' });

  // Fetch API
  const fetchGroups = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await httpRequest.get('/api/groups/admin/all', {
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
        setGroups(res.data.groups);
        setTotalPages(res.data.totalPages);
        setTotalGroups(res.data.total);
      }
    } catch (error) {
      console.error('Lỗi tải groups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchGroups();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [page, limit, sortConfig, searchTerm]);

  // Handle Sort
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
    if (
      !window.confirm(
        'CẢNH BÁO: Xóa nhóm sẽ mất toàn bộ chat và task trong nhóm này. Tiếp tục?'
      )
    )
      return;
    try {
      const token = localStorage.getItem('token');
      await httpRequest.delete(`/api/groups/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchGroups();
      alert('Đã giải tán nhóm thành công!');
    } catch (error) {
      alert('Xóa thất bại');
    }
  };

  // 👇 Handle Open Edit Modal
  const handleEdit = (group: IGroup) => {
    setGroupToEdit(group);
    setIsModalOpen(true);
  };

  // 👇 Handle Submit Update Group
  const handleModalSubmit = async (data: any) => {
    if (!groupToEdit) return;
    const token = localStorage.getItem('token');
    try {
      await httpRequest.put(`/api/groups/admin/${groupToEdit._id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchGroups();
      alert('Cập nhật nhóm thành công!');
    } catch (error) {
      alert('Cập nhật thất bại');
    }
  };

  return (
    <div className={cx('wrapper')}>
      <header className={cx('header')}>
        <div className={cx('headerLeft')}>
          <h1 className={cx('title')}>
            Quản lý Nhóm <span className={cx('countBadge')}>{totalGroups}</span>
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
              placeholder="Search by group name..."
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
            Loading Groups...
          </div>
        ) : (
          <table className={cx('groupTable')}>
            <thead>
              <tr>
                <th
                  className={cx('thSortable')}
                  onClick={() => handleSort('name')}
                >
                  <div className={cx('headerContent')}>
                    Group Name {renderSortIcon('name')}
                  </div>
                </th>
                <th>Owner (Leader)</th>
                <th>Members</th>
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
              {groups.map((group) => (
                <tr key={group._id}>
                  <td>
                    <div className={cx('groupInfo')}>
                      <div className={cx('groupIcon')}>
                        <LayoutGrid size={20} />
                      </div>
                      <div>
                        <div>{group.name}</div>
                        <div
                          style={{
                            fontSize: '1.2rem',
                            color: '#94a3b8',
                            fontWeight: 400,
                          }}
                        >
                          ID: {group._id.slice(-6)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      {group.owner?.avatar ? (
                        <img
                          src={`/${group.owner.avatar.replace(/\\/g, '/')}`}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            objectFit: 'cover',
                          }}
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
                      <span>{group.owner?.username || 'Unknown'}</span>
                    </div>
                  </td>
                  <td>
                    <div className={cx('membersAvatars')}>
                      {group.members.slice(0, 5).map((mem) => (
                        <img
                          key={mem._id}
                          src={
                            mem.avatar
                              ? `/${mem.avatar.replace(/\\/g, '/')}`
                              : 'https://via.placeholder.com/30'
                          }
                          title={mem.username}
                        />
                      ))}
                      {group.members.length > 5 && (
                        <div className={cx('moreCount')}>
                          +{group.members.length - 5}
                        </div>
                      )}
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: '1.3rem',
                          color: '#64748b',
                        }}
                      >
                        ({group.members.length} users)
                      </span>
                    </div>
                  </td>
                  <td>
                    {new Date(group.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {/* 👇 Button Edit Group */}
                      <button
                        className={cx('deleteBtn')}
                        style={{ color: '#3b82f6', borderColor: 'transparent' }}
                        onClick={() => handleEdit(group)}
                        title="Sửa nhóm"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        className={cx('deleteBtn')}
                        onClick={() => handleDelete(group._id)}
                        title="Giải tán nhóm"
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
        totalItems={totalGroups}
        limit={limit}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />

      {/* 👇 Modal Edit cho Admin */}
      <GroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={
          groupToEdit
            ? {
                name: groupToEdit.name,
                description: groupToEdit.description || '',
              }
            : null
        }
        title="Admin: Chỉnh sửa Nhóm"
      />
    </div>
  );
};

export default GroupManagement;
