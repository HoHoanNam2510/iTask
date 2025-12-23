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
} from 'lucide-react';
import styles from './Calendar.module.scss';
import TaskModal from '~/components/TaskModal/TaskModal'; // Import Modal mới
import type { ITaskResponse } from '~/types/task';

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // State quản lý Modal
  const [isListModalOpen, setIsListModalOpen] = useState(false); // Modal xem danh sách task trong ngày
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false); // Modal thêm mới task

  const [tasks, setTasks] = useState<ITaskResponse[]>([]);
  // [MỚI] State lưu task đang muốn sửa
  const [editingTask, setEditingTask] = useState<ITaskResponse | null>(null);

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
    setIsListModalOpen(true); // Mở danh sách xem trước
  };

  const handleOpenAddForm = () => {
    setEditingTask(null); // Đảm bảo clear task cũ để ra form thêm mới
    setIsListModalOpen(false); // Đóng list view
    setIsTaskModalOpen(true); // Mở form thêm mới
  };

  // [MỚI] Hàm mở form Edit
  const handleOpenEditForm = (task: ITaskResponse) => {
    setEditingTask(task); // Lưu task cần sửa
    setIsListModalOpen(false); // Đóng list
    setIsTaskModalOpen(true); // Mở form modal
  };

  // [MỚI] Hàm Xóa thật
  const handleDeleteTask = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa vĩnh viễn?')) {
      try {
        const token = localStorage.getItem('token');
        // Gọi API xóa
        await axios.delete(`http://localhost:5000/api/tasks/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Xóa thành công -> Load lại list task
        fetchTasks();
      } catch (error) {
        console.error('Lỗi xóa task:', error);
        alert('Không thể xóa task này.');
      }
    }
  };

  // Filter task cho ngày đang chọn
  const tasksForSelectedDate = tasks.filter(
    (t) => selectedDate && isSameDay(new Date(t.dueDate), selectedDate)
  );

  // --- RENDER LIST VIEW (Modal nhỏ xem danh sách) ---
  const renderListView = () => (
    <>
      <div className={styles.modalHeader}>
        <h3>
          Công việc ngày {selectedDate && format(selectedDate, 'dd/MM/yyyy')}
        </h3>
        <button onClick={() => setIsListModalOpen(false)}>
          <X size={20} />
        </button>
      </div>

      <div className={styles.listViewHeader}>
        <span>{tasksForSelectedDate.length} công việc</span>
        <button className={styles.addNewBtn} onClick={handleOpenAddForm}>
          <Plus size={16} /> Thêm mới
        </button>
      </div>

      <ul className={styles.taskList}>
        {tasksForSelectedDate.length === 0 && (
          <p className={styles.emptyText}>Chưa có công việc nào.</p>
        )}
        {tasksForSelectedDate.map((task) => (
          <li key={task._id} className={styles.taskItem}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{task.title}</div>
              <div
                style={{
                  fontSize: 12,
                  color: '#64748b',
                  textTransform: 'capitalize',
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
              {/* NÚT EDIT */}
              <button
                className={styles.deleteBtn} // Tái sử dụng class hoặc tạo class mới .editBtn
                style={{ color: '#3b82f6' }} // Màu xanh dương cho nút sửa
                onClick={() => handleOpenEditForm(task)}
              >
                <Edit2 size={16} />
              </button>

              {/* NÚT DELETE */}
              <button
                className={styles.deleteBtn}
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

  // --- MAIN RENDER ---
  return (
    <div className={styles.calendarContainer}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>{format(currentDate, 'MMMM yyyy', { locale: vi })}</h2>
        </div>
        <div className={styles.navButtons}>
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
      <div className={styles.weekDaysGrid}>
        {weekDays.map((day) => (
          <div key={day} className={styles.weekDayCell}>
            {day}
          </div>
        ))}
      </div>

      {/* DAYS GRID */}
      <div className={styles.daysGrid}>
        {calendarDays.map((day, index) => {
          const dayTasks = tasks.filter((t) =>
            isSameDay(new Date(t.dueDate), day)
          );
          const isCurrentMonth = isSameMonth(day, monthStart);

          // Tính số lượng task dư ra
          const moreCount = dayTasks.length - 2;

          return (
            <div
              key={index}
              className={`${styles.dayCell} ${
                !isCurrentMonth ? styles.disabled : ''
              } ${isToday(day) ? styles.today : ''}`}
              onClick={() => handleDayClick(day)}
            >
              {/* 👇 [SỬA] Bọc DateNumber và MoreCount vào 1 Header row */}
              <div className={styles.dayHeader}>
                <div className={styles.dateNumber}>{format(day, 'd')}</div>

                {/* Nếu có hơn 2 task thì hiện số lượng dư ở góc phải */}
                {moreCount > 0 && (
                  <div className={styles.moreCount}>+{moreCount} nữa</div>
                )}
              </div>

              <div className={styles.taskPreviewList}>
                {dayTasks.slice(0, 2).map((t) => (
                  <div key={t._id} className={styles.taskDot} title={t.title}>
                    {t.title}
                  </div>
                ))}
                {/* ❌ ĐÃ XÓA đoạn render moreTasks cũ ở dưới này */}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: Xem danh sách task trong ngày */}
      {isListModalOpen && selectedDate && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsListModalOpen(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            style={{ height: 'auto', maxHeight: '600px' }} // Override height cho modal list
          >
            {renderListView()}
          </div>
        </div>
      )}

      {/* MODAL 2: Truyền thêm prop taskToEdit */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null); // Reset khi đóng
        }}
        onSuccess={() => {
          fetchTasks();
          setIsListModalOpen(true); // Mở lại list để xem kết quả
        }}
        defaultDate={selectedDate || new Date()}
        taskToEdit={editingTask} // <--- Truyền task cần sửa vào đây
      />
    </div>
  );
};

export default Calendar;
