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
import GroupModal from '~/components/Modals/GroupModal/GroupModal';
import { getImageUrl } from '~/utils/imageHelper';

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
  const [totalPages, setTotalPages] = useState(1);
  const [totalGroups, setTotalGroups] = useState(0);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'createdAt', direction: 'desc' });

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
    const delayDebounceFn = setTimeout(() => {
      fetchGroups();
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
    if (!window.confirm('CẢNH BÁO: Giải tán nhóm này?')) return;
    try {
      const token = localStorage.getItem('token');
      await httpRequest.delete(`/api/groups/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchGroups();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Xóa thất bại');
    }
  };

  const handleEdit = (group: IGroup) => {
    setGroupToEdit(group);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (formData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (groupToEdit) {
        await httpRequest.put(
          `/api/groups/admin/${groupToEdit._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setIsModalOpen(false);
      fetchGroups();
    } catch (error) {
      alert('Lỗi cập nhật nhóm');
    }
  };

  return (
    <div className={cx('wrapper')}>
      <div className={cx('header')}>
        <div className={cx('headerLeft')}>
          <h1 className={cx('title')}>
            Group Management{' '}
            <span className={cx('countBadge')}>{totalGroups}</span>
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
              placeholder="Search group name..."
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
          <table className={cx('groupTable')}>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')}>
                  <div className={cx('thContent')}>
                    GROUP NAME {renderSortIcon('name')}
                  </div>
                </th>
                <th>DESCRIPTION</th>
                <th>OWNER (LEADER)</th>
                <th>MEMBERS</th>
                <th onClick={() => handleSort('createdAt')}>
                  <div className={cx('thContent')}>
                    CREATED AT {renderSortIcon('createdAt')}
                  </div>
                </th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group._id}>
                  <td>
                    <div className={cx('groupName')}>
                      <LayoutGrid size={18} color="#3b82f6" />
                      {group.name}
                    </div>
                  </td>
                  <td>
                    <div className={cx('descCell')}>
                      {group.description || '-'}
                    </div>
                  </td>
                  <td>
                    <div className={cx('ownerInfo')}>
                      {group.owner.avatar ? (
                        <img
                          src={getImageUrl(group.owner.avatar)}
                          alt="owner"
                          className={cx('avatar')}
                        />
                      ) : (
                        <div className={cx('avatarPlaceholder')}>
                          {group.owner.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{group.owner.username}</span>
                    </div>
                  </td>
                  <td>
                    <div className={cx('membersList')}>
                      {group.members.slice(0, 4).map((mem) => (
                        <div
                          key={mem._id}
                          className={cx('memberAvatarWrapper')}
                          title={mem.username}
                        >
                          {mem.avatar ? (
                            <img
                              src={getImageUrl(mem.avatar)}
                              className={cx('memberAvatar')}
                              alt={mem.username}
                            />
                          ) : (
                            <div className={cx('memberPlaceholder')}>
                              {mem.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      ))}
                      {group.members.length > 4 && (
                        <div className={cx('moreMembers')}>
                          +{group.members.length - 4}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    {new Date(group.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td>
                    <div className={cx('actionCell')}>
                      <button
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
