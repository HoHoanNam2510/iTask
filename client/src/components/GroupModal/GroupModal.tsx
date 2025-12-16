import React, { useState } from 'react';
import classNames from 'classnames/bind';
import axios from 'axios'; // Import axios
import { X, Users, PlusCircle } from 'lucide-react';
import styles from './GroupModal.module.scss';

const cx = classNames.bind(styles);

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // [QUAN TRỌNG] Thêm prop này để reload sidebar
}

type TabType = 'join' | 'create';

const GroupModal: React.FC<GroupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('join');
  const [isLoading, setIsLoading] = useState(false); // [MỚI] Loading state

  // State cho Form
  const [joinId, setJoinId] = useState(''); // Đây là Invite Code
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');

  if (!isOpen) return null;

  // Xử lý submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      setIsLoading(true);

      if (activeTab === 'join') {
        // --- LOGIC JOIN GROUP ---
        // Gọi API tham gia nhóm bằng Invite Code
        // (Lưu ý: Bạn cần đảm bảo Backend có route này: POST /api/groups/join)
        const res = await axios.post(
          'http://localhost:5000/api/groups/join',
          { inviteCode: joinId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          alert(`Đã tham gia nhóm: ${res.data.group.name}`);
        }
      } else {
        // --- LOGIC CREATE GROUP ---
        const res = await axios.post(
          'http://localhost:5000/api/groups',
          { name: groupName, description: groupDesc },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          alert('Tạo nhóm thành công!');
        }
      }

      // --- XỬ LÝ SAU KHI THÀNH CÔNG ---
      // 1. Reset form
      setJoinId('');
      setGroupName('');
      setGroupDesc('');

      // 2. Gọi callback để reload Sidebar
      if (onSuccess) {
        onSuccess();
      }

      // 3. Đóng modal
      onClose();
    } catch (error: any) {
      console.error('Lỗi:', error);
      const msg =
        error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại';
      alert(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cx('overlay')} onClick={onClose}>
      {/* stopPropagation để click vào modal không bị đóng */}
      <div className={cx('modal')} onClick={(e) => e.stopPropagation()}>
        {/* Header Close Button */}
        <div className={cx('header')}>
          <button className={cx('closeBtn')} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className={cx('tabs')}>
          <button
            className={cx('tab', { active: activeTab === 'join' })}
            onClick={() => setActiveTab('join')}
          >
            Join Group
          </button>
          <button
            className={cx('tab', { active: activeTab === 'create' })}
            onClick={() => setActiveTab('create')}
          >
            Create Group
          </button>
        </div>

        {/* Content Body */}
        <div className={cx('content')}>
          {activeTab === 'join' ? (
            <>
              <h3>Join a Team</h3>
              <p>Enter the unique Invite Code shared by your team admin.</p>
              <form onSubmit={handleSubmit}>
                <div className={cx('inputGroup')}>
                  <label className={cx('label')}>Invite Code</label>
                  <input
                    type="text"
                    className={cx('input')}
                    placeholder="e.g. Xy7Bz"
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                    spellCheck={false}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className={cx('actions')}>
                  <button
                    type="button"
                    className={cx('cancelBtn')}
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={cx('submitBtn')}
                    disabled={isLoading}
                  >
                    <Users
                      size={18}
                      style={{ marginRight: '8px', display: 'inline' }}
                    />
                    {isLoading ? 'Joining...' : 'Join Group'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h3>Create New Workspace</h3>
              <p>Set up a space for your team to collaborate.</p>
              <form onSubmit={handleSubmit}>
                <div className={cx('inputGroup')}>
                  <label className={cx('label')}>Group Name</label>
                  <input
                    type="text"
                    className={cx('input')}
                    placeholder="e.g. Awesome Project"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    spellCheck={false}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className={cx('inputGroup')}>
                  <label className={cx('label')}>Description (Optional)</label>
                  <input
                    type="text"
                    className={cx('input')}
                    placeholder="What is this group about?"
                    value={groupDesc}
                    onChange={(e) => setGroupDesc(e.target.value)}
                    spellCheck={false}
                    disabled={isLoading}
                  />
                </div>
                <div className={cx('actions')}>
                  <button
                    type="button"
                    className={cx('cancelBtn')}
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={cx('submitBtn')}
                    disabled={isLoading}
                  >
                    <PlusCircle
                      size={18}
                      style={{ marginRight: '8px', display: 'inline' }}
                    />
                    {isLoading ? 'Creating...' : 'Create Group'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupModal;
