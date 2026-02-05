/* client/src/pages/Admin/TaskManagement/TaskManagement.tsx */
import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import {
  Trash2,
  Search,
  Edit2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import httpRequest from '~/utils/httpRequest';
import type { ITaskResponse } from '~/types/task';
import styles from './TaskManagement.module.scss';
import TaskModal from '~/components/TaskModal/TaskModal';
import { getImageUrl } from '~/utils/imageHelper'; // 👇 [MỚI] Import helper

const cx = classNames.bind(styles);

// 👇 Dùng Omit để loại bỏ 'creator' gốc trước khi định nghĩa lại
interface IAdminTask extends Omit<ITaskResponse, 'creator'> {
  creator?: {
    _id: string;
    username: string;
    email?: string;
    avatar?: string;
  };
}

const TaskManagement = () => {
  const [tasks, setTasks] = useState<IAdminTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);

  // Search & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'createdAt', direction: 'desc' });

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<IAdminTask | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await httpRequest.get('/api/tasks/admin/all', {
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
        setTasks(res.data.tasks);
        setTotalPages(res.data.totalPages);
        setTotalTasks(res.data.total);
      }
    } catch (error) {
      console.error('Lỗi tải tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTasks();
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
      return <ArrowUpDown size={14} color="#BFC9D1" />;
    return sortConfig.direction === 'asc' ? (
      <ArrowUp size={14} color="#EAEFEF" />
    ) : (
      <ArrowDown size={14} color="#EAEFEF" />
    );
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Admin: Bạn có chắc chắn muốn xóa Task này không?'))
      return;
    try {
      const token = localStorage.getItem('token');
      await httpRequest.delete(`/api/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTasks();
      alert('Đã xóa task thành công!');
    } catch (error) {
      console.error(error);
      alert('Xóa thất bại');
    }
  };

  const handleEdit = (task: IAdminTask) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className={cx('paginationContainer')}>
        <div className={cx('paginationControls')}>
          <button
            className={cx('pageBtn')}
            disabled={page === 1}
            onClick={() => setPage(1)}
            title="First Page"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            className={cx('pageBtn')}
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            title="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>

          {pages.map((p) => (
            <button
              key={p}
              className={cx('pageNumber', { active: p === page })}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}

          <button
            className={cx('pageBtn')}
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            title="Next Page"
          >
            <ChevronRight size={16} />
          </button>
          <button
            className={cx('pageBtn')}
            disabled={page === totalPages}
            onClick={() => setPage(totalPages)}
            title="Last Page"
          >
            <ChevronsRight size={16} />
          </button>
        </div>

        <div className={cx('pageSizeControl')}>
          <input
            type="number"
            min={1}
            max={100}
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className={cx('pageSizeInput')}
          />
          <span>of {totalTasks} items</span>
        </div>
      </div>
    );
  };

  return (
    <div className={cx('wrapper')}>
      <header className={cx('header')}>
        <div className={cx('headerLeft')}>
          <h1 className={cx('title')}>
            Quản lý Tasks <span className={cx('countBadge')}>{totalTasks}</span>
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
                color: '#BFC9D1',
              }}
            />
            <input
              type="text"
              placeholder="Search by title..."
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
            Loading Tasks...
          </div>
        ) : (
          <table className={cx('taskTable')}>
            <thead>
              <tr>
                <th
                  className={cx('thSortable')}
                  onClick={() => handleSort('title')}
                >
                  <div className={cx('headerContent')}>
                    Task Name {renderSortIcon('title')}
                  </div>
                </th>
                <th>Creator (Owner)</th>
                <th
                  className={cx('thSortable')}
                  onClick={() => handleSort('status')}
                >
                  <div className={cx('headerContent')}>
                    Status {renderSortIcon('status')}
                  </div>
                </th>
                <th
                  className={cx('thSortable')}
                  onClick={() => handleSort('priority')}
                >
                  <div className={cx('headerContent')}>
                    Priority {renderSortIcon('priority')}
                  </div>
                </th>
                <th
                  className={cx('thSortable')}
                  onClick={() => handleSort('dueDate')}
                >
                  <div className={cx('headerContent')}>
                    Due Date {renderSortIcon('dueDate')}
                  </div>
                </th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>
                    Không tìm thấy task nào.
                  </td>
                </tr>
              )}
              {tasks.map((task) => (
                <tr key={task._id}>
                  <td>
                    <div className={cx('taskInfo')}>
                      <div style={{ fontWeight: 600 }}>{task.title}</div>
                      <div className={cx('desc')}>
                        {task.description || 'No description'}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          marginTop: '6px',
                        }}
                      >
                        {task.category && typeof task.category === 'object' && (
                          <span
                            style={{
                              fontSize: '1rem',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor:
                                (task.category as any).color || '#eee',
                              color: '#fff',
                              fontWeight: 600,
                            }}
                          >
                            {(task.category as any).name}
                          </span>
                        )}
                        {task.group && typeof task.group === 'object' && (
                          <span
                            style={{
                              fontSize: '1rem',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: '#e2e8f0',
                              color: '#475569',
                              border: '1px solid #cbd5e1',
                            }}
                          >
                            👥 {(task.group as any).name}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={cx('creatorInfo')}>
                      {/* 👇 [ĐÃ SỬA] Dùng getImageUrl */}
                      {task.creator?.avatar ? (
                        <img
                          src={getImageUrl(task.creator.avatar)}
                          alt="avt"
                          className={cx('avatar')}
                        />
                      ) : (
                        <div
                          className={cx('avatarPlaceholder')}
                          style={{
                            width: 32,
                            height: 32,
                            background: '#eee',
                            borderRadius: '50%',
                          }}
                        />
                      )}
                      <span>{task.creator?.username || 'Unknown'}</span>
                    </div>
                  </td>
                  <td>
                    <span className={cx('statusBadge', task.status)}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={cx('priorityBadge', task.priority)}>
                      {task.priority}
                    </span>
                  </td>
                  <td>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        fontSize: '1.3rem',
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>
                        {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '1.1rem' }}>
                        {new Date(task.createdAt).toLocaleTimeString('vi-VN')}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        className={cx('actionBtn', 'edit')}
                        onClick={() => handleEdit(task)}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        className={cx('deleteBtn')}
                        onClick={() => handleDelete(task._id)}
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

      {renderPagination()}

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        onSuccess={() => fetchTasks()}
        taskToEdit={taskToEdit as any}
      />
    </div>
  );
};

export default TaskManagement;
