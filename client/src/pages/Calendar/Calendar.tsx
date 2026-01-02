/* client/src/pages/Calendar/Calendar.tsx */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
  Edit2,
  Users,
  User,
  Layers,
} from 'lucide-react';
import classNames from 'classnames/bind';
import styles from './Calendar.module.scss';
import TaskModal from '~/components/TaskModal/TaskModal';
import type { ITaskResponse } from '~/types/task';

const cx = classNames.bind(styles);

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // State quản lý Modal
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const [tasks, setTasks] = useState<ITaskResponse[]>([]);
  const [editingTask, setEditingTask] = useState<ITaskResponse | null>(null);

  // 👇 [MỚI] State bộ lọc: 'all' | 'personal' | 'group'
  const [filterMode, setFilterMode] = useState<'all' | 'personal' | 'group'>(
    'all'
  );

  // --- FETCH DATA ---
  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data.tasks || []);
    } catch (error) {
      console.error('Lỗi tải task:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // --- LOGIC LỌC TASK THEO MODE ---
  const getFilteredTasks = () => {
    return tasks.filter((task) => {
      if (filterMode === 'all') return true;
      if (filterMode === 'personal') return !task.group; // Không có group -> Cá nhân
      if (filterMode === 'group') return !!task.group; // Có group -> Nhóm
      return true;
    });
  };

  const filteredTasks = getFilteredTasks();

  // --- LOGIC LỊCH ---
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  // --- HANDLERS ---
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setIsListModalOpen(true);
  };

  const handleOpenAddForm = () => {
    setEditingTask(null);
    setIsListModalOpen(false);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditForm = (task: ITaskResponse) => {
    setEditingTask(task);
    setIsListModalOpen(false);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa vĩnh viễn?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/tasks/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchTasks();
      } catch (error) {
        console.error('Lỗi xóa task:', error);
        alert('Không thể xóa task này.');
      }
    }
  };

  // Filter task cho ngày đang chọn (dựa trên list đã lọc theo mode)
  const tasksForSelectedDate = filteredTasks.filter(
    (t) => selectedDate && isSameDay(new Date(t.dueDate), selectedDate)
  );

  // --- RENDER LIST VIEW ---
  const renderListView = () => (
    <>
      <div className={cx('modalHeader')}>
        <h3>
          Công việc ngày {selectedDate && format(selectedDate, 'dd/MM/yyyy')}
        </h3>
        <button onClick={() => setIsListModalOpen(false)}>
          <X size={20} />
        </button>
      </div>

      <div className={cx('listViewHeader')}>
        <span>
          {tasksForSelectedDate.length} công việc (
          {filterMode === 'all' ? 'Tất cả' : filterMode})
        </span>
        <button className={cx('addNewBtn')} onClick={handleOpenAddForm}>
          <Plus size={16} /> Thêm mới
        </button>
      </div>

      <ul className={cx('taskList')}>
        {tasksForSelectedDate.length === 0 && (
          <p className={cx('emptyText')}>
            Không có công việc nào trong danh mục này.
          </p>
        )}
        {tasksForSelectedDate.map((task) => (
          <li key={task._id} className={cx('taskItem')}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {task.title}
                {/* Badge phân loại trong list */}
                {task.group ? (
                  <span className={cx('typeBadge', 'group')}>
                    Group: {(task.group as any).name}
                  </span>
                ) : (
                  <span className={cx('typeBadge', 'personal')}>Personal</span>
                )}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#64748b',
                  textTransform: 'capitalize',
                  marginTop: 4,
                }}
              >
                {task.priority} •{' '}
                {task.description ? 'Có mô tả' : 'Không mô tả'}
              </div>
            </div>
            {task.image && (
              <img
                src={`http://localhost:5000/${task.image}`}
                alt="Task"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 4,
                  objectFit: 'cover',
                  marginRight: 10,
                }}
              />
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={cx('actionBtn', 'edit')}
                onClick={() => handleOpenEditForm(task)}
              >
                <Edit2 size={16} />
              </button>
              <button
                className={cx('actionBtn', 'delete')}
                onClick={() => handleDeleteTask(task._id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <div className={cx('calendarContainer')}>
      {/* HEADER */}
      <div className={cx('header')}>
        <div className={cx('headerTitle')}>
          <h2>{format(currentDate, 'MMMM yyyy', { locale: vi })}</h2>
        </div>

        {/* 👇 [MỚI] BỘ LỌC VIEW MODE */}
        <div className={cx('filterControls')}>
          <button
            className={cx({ active: filterMode === 'all' })}
            onClick={() => setFilterMode('all')}
            title="Tất cả"
          >
            <Layers size={16} /> All
          </button>
          <button
            className={cx({ active: filterMode === 'personal' })}
            onClick={() => setFilterMode('personal')}
            title="Cá nhân"
          >
            <User size={16} /> Personal
          </button>
          <button
            className={cx({ active: filterMode === 'group' })}
            onClick={() => setFilterMode('group')}
            title="Nhóm"
          >
            <Users size={16} /> Group
          </button>
        </div>

        <div className={cx('navButtons')}>
          <button onClick={prevMonth}>
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setCurrentDate(new Date())}>Hôm nay</button>
          <button onClick={nextMonth}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* WEEKDAYS */}
      <div className={cx('weekDaysGrid')}>
        {weekDays.map((day) => (
          <div key={day} className={cx('weekDayCell')}>
            {day}
          </div>
        ))}
      </div>

      {/* DAYS GRID */}
      <div className={cx('daysGrid')}>
        {calendarDays.map((day, index) => {
          // Lấy task của ngày đó (đã qua bộ lọc)
          const dayTasks = filteredTasks.filter((t) =>
            isSameDay(new Date(t.dueDate), day)
          );
          const isCurrentMonth = isSameMonth(day, monthStart);
          const moreCount = dayTasks.length - 2;

          return (
            <div
              key={index}
              className={cx('dayCell', {
                disabled: !isCurrentMonth,
                today: isToday(day),
              })}
              onClick={() => handleDayClick(day)}
            >
              <div className={cx('dayHeader')}>
                <div className={cx('dateNumber')}>{format(day, 'd')}</div>
                {moreCount > 0 && (
                  <div className={cx('moreCount')}>+{moreCount}</div>
                )}
              </div>

              <div className={cx('taskPreviewList')}>
                {dayTasks.slice(0, 2).map((t) => (
                  <div
                    key={t._id}
                    // 👇 [MỚI] Thêm class 'groupTask' nếu là task nhóm để đổi màu
                    className={cx('taskDot', { groupTask: !!t.group })}
                    title={t.title}
                  >
                    {t.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL LIST VIEW */}
      {isListModalOpen && selectedDate && (
        <div
          className={cx('modalOverlay')}
          onClick={() => setIsListModalOpen(false)}
        >
          <div
            className={cx('modalContent')}
            onClick={(e) => e.stopPropagation()}
            style={{ height: 'auto', maxHeight: '600px' }}
          >
            {renderListView()}
          </div>
        </div>
      )}

      {/* MODAL ADD/EDIT TASK */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSuccess={() => {
          fetchTasks();
          setIsListModalOpen(true);
        }}
        defaultDate={selectedDate || new Date()}
        taskToEdit={editingTask}
      />
    </div>
  );
};

export default Calendar;
