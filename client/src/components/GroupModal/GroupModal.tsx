import React, { useState } from 'react';
import classNames from 'classnames/bind';
import { X, Users, PlusCircle } from 'lucide-react';
import styles from './GroupModal.module.scss';

const cx = classNames.bind(styles);

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'join' | 'create';

const GroupModal: React.FC<GroupModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('join');

  // State cho Form
  const [joinId, setJoinId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');

  if (!isOpen) return null;

  // Xử lý submit (Fake logic)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'join') {
      console.log('Joining group with ID:', joinId);
      // Gọi API join group ở đây
    } else {
      console.log('Creating group:', { name: groupName, desc: groupDesc });
      // Gọi API create group ở đây
    }
    // Sau khi xong thì đóng modal và reset form
    setJoinId('');
    setGroupName('');
    setGroupDesc('');
    onClose();
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
              <p>Enter the unique Group ID shared by your team admin.</p>
              <form onSubmit={handleSubmit}>
                <div className={cx('inputGroup')}>
                  <label className={cx('label')}>Group ID</label>
                  <input
                    type="text"
                    className={cx('input')}
                    placeholder="e.g. 789-xyz-123"
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                    required
                  />
                </div>
                <div className={cx('actions')}>
                  <button
                    type="button"
                    className={cx('cancelBtn')}
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={cx('submitBtn')}>
                    <Users
                      size={18}
                      style={{ marginRight: '8px', display: 'inline' }}
                    />
                    Join Group
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
                    required
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
                  />
                </div>
                <div className={cx('actions')}>
                  <button
                    type="button"
                    className={cx('cancelBtn')}
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={cx('submitBtn')}>
                    <PlusCircle
                      size={18}
                      style={{ marginRight: '8px', display: 'inline' }}
                    />
                    Create Group
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
