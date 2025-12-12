import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import classNames from 'classnames/bind';
import styles from './Group.module.scss';
// import { Users, Calendar, CheckSquare } from 'lucide-react';

const cx = classNames.bind(styles);

// --- TYPE DEFINITIONS (Khớp với Backend Schema) ---

// 1. Định nghĩa User cơ bản (vì assignee và members trả về object user)
interface UserBasic {
  _id: string;
  username: string;
  avatar?: string;
  email?: string;
}

// 2. Định nghĩa Task khớp với API
interface Task {
  _id: string; // MongoDB dùng _id (string) thay vì id (number)
  title: string;
  status: 'todo' | 'in_progress' | 'completed'; // Enum từ Backend
  assignee: UserBasic; // Backend populate object user
}

// 3. Định nghĩa Group khớp với API
interface GroupData {
  _id: string;
  title: string;
  description: string;
  members: UserBasic[];
  tasks: Task[];
  inviteCode?: string;
}

const Group: React.FC = () => {
  // groupId lấy từ URL bây giờ phải là _id của MongoDB (ví dụ: 65b123...)
  const { groupId } = useParams<{ groupId: string }>();

  const [data, setData] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(false);

  // --- CALL API ---
  useEffect(() => {
    if (!groupId) return;

    const fetchGroupData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        // Gọi API Backend
        const res = await axios.get(
          `http://localhost:5000/api/groups/${groupId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.data.success) {
          const apiData = res.data.data;
          // Map dữ liệu từ API vào State
          setData({
            _id: apiData.id,
            title: apiData.title,
            description: apiData.description,
            members: apiData.members,
            tasks: apiData.tasks,
            inviteCode: apiData.inviteCode,
          });
        }
      } catch (error) {
        console.error('Lỗi tải group:', error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId]);

  // --- RENDER HELPERS ---

  if (loading) {
    return (
      <div className={cx('wrapper')}>
        <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
          Đang tải dữ liệu nhóm...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={cx('wrapper')}>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Không tìm thấy nhóm này</h2>
          <p>Vui lòng kiểm tra lại đường dẫn hoặc chọn nhóm khác.</p>
        </div>
      </div>
    );
  }

  // Filter task theo status của Backend ('todo', 'in_progress', 'completed')
  const getTasksByStatus = (status: string) =>
    data.tasks.filter((t) => t.status === status);

  return (
    <div className={cx('wrapper')}>
      {/* Header */}
      <header className={cx('header')}>
        <div className={cx('info')}>
          <h1>{data.title}</h1>
          <p>{data.description}</p>
        </div>
        <div className={cx('actions')}>
          <div className={cx('members')}>
            {/* Hiển thị Avatar thành viên */}
            {data.members.slice(0, 4).map((m) => (
              <div key={m._id} className={cx('avatar')} title={m.username}>
                {m.avatar ? (
                  <img
                    src={m.avatar}
                    alt={m.username}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  m.username.charAt(0).toUpperCase()
                )}
              </div>
            ))}
            {data.members.length > 4 && (
              <div
                className={cx('avatar')}
                style={{ backgroundColor: '#ccc', color: '#555' }}
              >
                +{data.members.length - 4}
              </div>
            )}
          </div>
          <button
            className={cx('invite-btn')}
            onClick={() => alert(`Mã mời nhóm: ${data.inviteCode}`)}
          >
            + Invite
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className={cx('stats-container')}>
        <StatCard label="Total Tasks" value={data.tasks.length} />
        <StatCard
          label="In Progress"
          value={getTasksByStatus('in_progress').length}
        />
        <StatCard label="Done" value={getTasksByStatus('completed').length} />
      </div>

      {/* Kanban Board */}
      <div className={cx('board-container')}>
        {/* Truyền đúng key status của backend vào hàm filter */}
        <TaskColumn title="To Do" tasks={getTasksByStatus('todo')} />
        <TaskColumn
          title="In Progress"
          tasks={getTasksByStatus('in_progress')}
        />
        <TaskColumn title="Done" tasks={getTasksByStatus('completed')} />
      </div>
    </div>
  );
};

// --- SUB COMPONENTS ---

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className={cx('stat-card')}>
    <div className={cx('label')}>{label}</div>
    <div className={cx('value')}>{value}</div>
  </div>
);

const TaskColumn = ({ title, tasks }: { title: string; tasks: Task[] }) => (
  <div className={cx('column')}>
    <h3>
      {title} <span className={cx('count')}>{tasks.length}</span>
    </h3>

    <div className={cx('taskList')}>
      {tasks.length > 0 ? (
        tasks.map((task) => (
          <div
            key={task._id}
            className={cx('task-card', {
              todo: task.status === 'todo',
              inprogress: task.status === 'in_progress',
              done: task.status === 'completed',
            })}
          >
            <div className={cx('task-title')}>{task.title}</div>
            {/* Hiển thị tên người được assign (task.assignee là object) */}
            <div className={cx('task-meta')}>
              Assignee: {task.assignee ? task.assignee.username : 'Unassigned'}
            </div>
          </div>
        ))
      ) : (
        <div
          style={{
            textAlign: 'center',
            color: '#aaa',
            padding: '20px 0',
            fontSize: '1.4rem',
          }}
        >
          Trống
        </div>
      )}
    </div>
  </div>
);

export default Group;
