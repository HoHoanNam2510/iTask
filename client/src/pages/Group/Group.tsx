/* src/pages/Group/Group.tsx */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Group.module.scss';
import { Users, Calendar, CheckSquare } from 'lucide-react'; // Có thể import thêm icon nếu cần trang trí

const cx = classNames.bind(styles);

// --- TYPE DEFINITIONS ---
type TaskStatus = 'To Do' | 'In Progress' | 'Done';

interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  assignee: string; // Tên người được giao
}

interface GroupData {
  id: string;
  title: string;
  description: string;
  members: string[]; // Tạm thời để string tên, sau này là Object User
  tasks: Task[];
}

// --- MOCK DATA (QUAN TRỌNG: ID PHẢI KHỚP VỚI SIDEBAR) ---
// Sidebar đang dùng: 'dev-team', 'marketing', 'study'
const MOCK_DB: Record<string, GroupData> = {
  'dev-team': {
    id: 'dev-team',
    title: 'Dev Team Frontend', // Khớp tên với Sidebar
    description: 'Xây dựng giao diện ReactJS cho dự án iTask.',
    members: ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve'], // 5 members
    tasks: [
      {
        id: 101,
        title: 'Dựng Layout Sidebar',
        status: 'Done',
        assignee: 'Alice',
      },
      {
        id: 102,
        title: 'Config Redux Toolkit',
        status: 'In Progress',
        assignee: 'Bob',
      },
      {
        id: 103,
        title: 'Tích hợp API Login',
        status: 'To Do',
        assignee: 'Charlie',
      },
    ],
  },
  marketing: {
    id: 'marketing',
    title: 'Marketing Campaign', // Khớp tên với Sidebar
    description: 'Chiến dịch quảng cáo ra mắt sản phẩm Mùa Hè.',
    members: [
      'Sarah',
      'Mike',
      'John',
      'Anna',
      'Tom',
      'Jerry',
      'Kenvin',
      'Lacy',
    ], // 8 members
    tasks: [
      {
        id: 201,
        title: 'Viết Content Facebook',
        status: 'Done',
        assignee: 'Sarah',
      },
      {
        id: 202,
        title: 'Thiết kế Banner',
        status: 'In Progress',
        assignee: 'Mike',
      },
      { id: 203, title: 'Booking KOLs', status: 'To Do', assignee: 'John' },
      { id: 204, title: 'Chạy Ads Google', status: 'To Do', assignee: 'Anna' },
    ],
  },
  study: {
    id: 'study',
    title: 'English Class', // Khớp tên với Sidebar
    description: 'Lớp học giao tiếp tiếng Anh buổi tối (3-5-7).',
    members: ['Teacher John', 'Student A', 'Student B', 'Student C'],
    tasks: [
      {
        id: 301,
        title: 'Làm bài tập Unit 5',
        status: 'To Do',
        assignee: 'Student A',
      },
      {
        id: 302,
        title: 'Chuẩn bị bài thuyết trình',
        status: 'In Progress',
        assignee: 'Student B',
      },
    ],
  },
};

const Group: React.FC = () => {
  // 1. Lấy ID từ URL (được thay đổi khi click Sidebar)
  const { groupId } = useParams<{ groupId: string }>();

  const [data, setData] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(false);

  // 2. useEffect lắng nghe sự thay đổi của groupId
  useEffect(() => {
    if (!groupId) return;

    setLoading(true);
    // Giả lập call API (delay nhẹ để thấy hiệu ứng loading khi chuyển trang)
    setTimeout(() => {
      const groupInfo = MOCK_DB[groupId];
      setData(groupInfo || null); // Nếu không tìm thấy ID thì set null
      setLoading(false);
    }, 300);
  }, [groupId]); // <-- Quan trọng: Chạy lại khi groupId thay đổi

  // --- Render Loading State ---
  if (loading) {
    return (
      <div className={cx('wrapper')}>
        <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
          Đang tải dữ liệu nhóm...
        </div>
      </div>
    );
  }

  // --- Render Not Found State ---
  if (!data) {
    return (
      <div className={cx('wrapper')}>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Không tìm thấy nhóm này</h2>
          <p>Vui lòng chọn nhóm khác từ menu bên trái.</p>
        </div>
      </div>
    );
  }

  // Helper filter task
  const getTasksByStatus = (status: TaskStatus) =>
    data.tasks.filter((t) => t.status === status);

  return (
    <div className={cx('wrapper')}>
      {/* Header */}
      <header className={cx('header')}>
        <div className={cx('info')}>
          <h1>
            {data.title}
            {/* Ẩn ID đi cho đẹp hoặc để nhỏ thôi */}
            {/* <span>#{data.id}</span> */}
          </h1>
          <p>{data.description}</p>
        </div>
        <div className={cx('actions')}>
          <div className={cx('members')}>
            {/* Hiển thị tối đa 4 avatar, còn lại hiện số + */}
            {data.members.slice(0, 4).map((m, i) => (
              <div key={i} className={cx('avatar')} title={m}>
                {m.charAt(0)}
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
          <button className={cx('invite-btn')}>+ Invite</button>
        </div>
      </header>

      {/* Stats */}
      <div className={cx('stats-container')}>
        <StatCard label="Total Tasks" value={data.tasks.length} />
        <StatCard
          label="In Progress"
          value={getTasksByStatus('In Progress').length}
        />
        <StatCard label="Done" value={getTasksByStatus('Done').length} />
      </div>

      {/* Kanban Board */}
      <div className={cx('board-container')}>
        <TaskColumn title="To Do" tasks={getTasksByStatus('To Do')} />
        <TaskColumn
          title="In Progress"
          tasks={getTasksByStatus('In Progress')}
        />
        <TaskColumn title="Done" tasks={getTasksByStatus('Done')} />
      </div>
    </div>
  );
};

// Sub-components giữ nguyên
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

    {/* [THÊM] Thêm class taskList vào đây để nhận style scroll */}
    <div className={cx('taskList')}>
      {tasks.length > 0 ? (
        tasks.map((task) => (
          <div
            key={task.id}
            className={cx('task-card', {
              todo: task.status === 'To Do',
              inprogress: task.status === 'In Progress',
              done: task.status === 'Done',
            })}
          >
            <div className={cx('task-title')}>{task.title}</div>
            <div className={cx('task-meta')}>Assignee: {task.assignee}</div>
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
