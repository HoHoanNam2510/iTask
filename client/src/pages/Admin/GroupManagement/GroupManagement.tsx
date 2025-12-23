import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import axios from 'axios';
import { Trash2, Search, LayoutGrid } from 'lucide-react';
import styles from './GroupManagement.module.scss';

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
  const [searchTerm, setSearchTerm] = useState('');

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        'http://localhost:5000/api/groups/admin/all',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data.success) {
        setGroups(res.data.groups);
      }
    } catch (error) {
      console.error('Lỗi tải groups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        'CẢNH BÁO: Xóa nhóm sẽ mất toàn bộ chat và task trong nhóm này. Tiếp tục?'
      )
    )
      return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/groups/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroups(groups.filter((g) => g._id !== id));
      alert('Đã giải tán nhóm thành công!');
    } catch (error) {
      alert('Xóa thất bại');
    }
  };

  // Filter
  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.owner.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading)
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>Loading Groups...</div>
    );

  return (
    <div className={cx('wrapper')}>
      <header className={cx('header')}>
        <h1 className={cx('title')}>
          Quản lý Nhóm <span className={cx('countBadge')}>{groups.length}</span>
        </h1>
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
            placeholder="Tìm tên nhóm hoặc chủ nhóm..."
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
        <table className={cx('groupTable')}>
          <thead>
            <tr>
              <th>Group Name</th>
              <th>Owner (Leader)</th>
              <th>Members</th>
              <th>Created At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredGroups.map((group) => (
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
                  {/* Hiển thị chủ nhóm */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    {group.owner?.avatar ? (
                      <img
                        src={`http://localhost:5000/${group.owner.avatar.replace(
                          /\\/g,
                          '/'
                        )}`}
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
                    {/* Hiển thị tối đa 5 avatar thành viên */}
                    {group.members.slice(0, 5).map((mem) => (
                      <img
                        key={mem._id}
                        src={
                          mem.avatar
                            ? `http://localhost:5000/${mem.avatar.replace(
                                /\\/g,
                                '/'
                              )}`
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
                <td>{new Date(group.createdAt).toLocaleDateString('vi-VN')}</td>
                <td>
                  <button
                    className={cx('deleteBtn')}
                    onClick={() => handleDelete(group._id)}
                    title="Giải tán nhóm"
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

export default GroupManagement;
