/* client/src/components/Modals/GroupModal/GroupModal.tsx */
import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import { X, Users, PlusCircle, Save } from 'lucide-react';
import httpRequest from '~/utils/httpRequest';
import styles from './GroupModal.module.scss';

const cx = classNames.bind(styles);

// Interface dữ liệu Group
export interface GroupData {
  name: string;
  description: string;
}

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  // Props dành riêng cho Admin Edit
  initialData?: GroupData | null;
  onSubmit?: (data: GroupData) => Promise<void>;
  title?: string;
}

type TabType = 'join' | 'create';

const GroupModal: React.FC<GroupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  onSubmit,
  title,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('join');
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [joinId, setJoinId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');

  // Xác định chế độ: Nếu có initialData -> Là Edit Mode (Admin)
  const isEditMode = !!initialData;

  // Reset hoặc Load data khi mở Modal
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Mode Edit (Admin): Fill dữ liệu
        setGroupName(initialData.name);
        setGroupDesc(initialData.description || '');
      } else {
        // Mode Create/Join (User): Reset trắng & Mặc định tab Create
        setGroupName('');
        setGroupDesc('');
        setJoinId('');
        setActiveTab('create'); // Mặc định vào tab Create cho tiện
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      setIsLoading(true);

      // --- TRƯỜNG HỢP 1: ADMIN EDIT ---
      // Nếu có prop onSubmit, component cha sẽ xử lý logic API
      if (isEditMode && onSubmit) {
        await onSubmit({ name: groupName, description: groupDesc });
        if (onSuccess) onSuccess();
        onClose();
        return;
      }

      // --- TRƯỜNG HỢP 2: USER NORMAL (Create/Join) ---
      if (activeTab === 'join') {
        const res = await httpRequest.post(
          '/api/groups/join',
          { inviteCode: joinId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          alert(`Đã tham gia nhóm: ${res.data.group.name}`);
        }
      } else {
        const res = await httpRequest.post(
          '/api/groups',
          { name: groupName, description: groupDesc },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          alert('Tạo nhóm thành công!');
        }
      }

      // Success cleanup
      setJoinId('');
      setGroupName('');
      setGroupDesc('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Lỗi Modal:', error);
      const msg = error.response?.data?.message || 'Có lỗi xảy ra';
      alert(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cx('overlay')} onClick={onClose}>
      <div className={cx('modal')} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={cx('header')}>
          <button className={cx('closeBtn')} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Tabs: Chỉ hiện khi KHÔNG phải Edit Mode */}
        {!isEditMode && (
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
        )}

        <div className={cx('content')}>
          {/* VIEW 1: JOIN GROUP (User only) */}
          {!isEditMode && activeTab === 'join' ? (
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
                      style={{
                        marginRight: 8,
                        display: 'inline-block',
                        verticalAlign: 'middle',
                      }}
                    />
                    Join Group
                  </button>
                </div>
              </form>
            </>
          ) : (
            // VIEW 2: CREATE / EDIT GROUP
            <>
              <h3>
                {title ||
                  (isEditMode
                    ? 'Admin: Chỉnh sửa Nhóm'
                    : 'Create New Workspace')}
              </h3>
              <p>
                {isEditMode
                  ? 'Cập nhật thông tin nhóm.'
                  : 'Set up a space for your team to collaborate.'}
              </p>
              <form onSubmit={handleSubmit}>
                <div className={cx('inputGroup')}>
                  <label className={cx('label')}>Group Name</label>
                  <input
                    type="text"
                    className={cx('input')}
                    placeholder="e.g. Awesome Project"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
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
                    {isEditMode ? (
                      <>
                        <Save
                          size={18}
                          style={{
                            marginRight: 8,
                            display: 'inline-block',
                            verticalAlign: 'middle',
                          }}
                        />
                        Save Changes
                      </>
                    ) : (
                      <>
                        <PlusCircle
                          size={18}
                          style={{
                            marginRight: 8,
                            display: 'inline-block',
                            verticalAlign: 'middle',
                          }}
                        />
                        Create Group
                      </>
                    )}
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
