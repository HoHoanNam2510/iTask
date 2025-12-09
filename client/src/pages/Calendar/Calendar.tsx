import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios'; // Import Axios
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
  Calendar as CalendarIcon,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import styles from './Calendar.module.scss';

// --- 1. TYPE DEFINITIONS (Khớp với Backend) ---
// Interface cho Task nhận từ API về
export interface ITaskResponse {
  _id: string; // MongoDB dùng _id
  title: string;
  description?: string;
  image?: string; // URL ảnh từ server
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'moderate' | 'extreme';
  dueDate: string; // Date từ API thường là string ISO
  category?: string;
}

// Mock Categories (Sau này sẽ gọi API lấy list này)
const MOCK_CATEGORIES = [
  { id: 'cat_1', name: 'Design' },
  { id: 'cat_2', name: 'Development' },
  { id: 'cat_3', name: 'Marketing' },
  { id: 'cat_4', name: 'Meeting' },
];

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date()); // Mặc định chọn hôm nay
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<'list' | 'form'>('list');

  // State lưu danh sách task
  const [tasks, setTasks] = useState<ITaskResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    priority: 'extreme' | 'moderate' | 'low';
    categoryId: string;
    date: string; // <--- THÊM MỚI: Dùng string format 'yyyy-MM-dd' cho input date
    imagePreview: string | null;
    imageFile: File | null;
  }>({
    title: '',
    description: '',
    priority: 'low',
    categoryId: '',
    date: '', // <--- Default rỗng
    imagePreview: null,
    imageFile: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 2. FETCH DATA TỪ API ---
  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token'); // Lấy token đăng nhập
      // Gọi API lấy toàn bộ task (hoặc filter theo tháng nếu backend hỗ trợ)
      const res = await axios.get('http://localhost:5000/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data.tasks || []); // Giả sử backend trả về { success: true, tasks: [...] }
    } catch (error) {
      console.error('Lỗi tải task:', error);
    }
  };

  // Gọi fetchTasks khi component mount
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
    setModalView('list');
    setIsModalOpen(true);
  };

  const tasksForSelectedDate = tasks.filter(
    (t) => selectedDate && isSameDay(new Date(t.dueDate), selectedDate)
  );

  // Cập nhật hàm mở form thêm mới (handleOpenAddForm)
  const handleOpenAddForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'low',
      categoryId: '',
      // Set mặc định là ngày đang chọn bên ngoài lịch, format về yyyy-MM-dd
      date: selectedDate
        ? format(selectedDate, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      imagePreview: null,
      imageFile: null,
    });
    setModalView('form');
  };

  // Xử lý chọn ảnh
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Tạo URL để preview
      const url = URL.createObjectURL(file);
      // 2. Lưu cả file gốc và url preview
      setFormData({ ...formData, imagePreview: url, imageFile: file });
    }
  };

  // --- 3. XỬ LÝ GỬI API (TẠO TASK) ---
  const handleSave = async () => {
    if (!formData.title.trim() || !selectedDate) return;

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');

      // CHUẨN BỊ FORM DATA (Bắt buộc dùng FormData để gửi file)
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('date', selectedDate.toISOString()); // Backend convert lại thành Date
      data.append('priority', formData.priority);

      if (formData.categoryId) {
        data.append('categoryId', formData.categoryId);
      }

      // Chỉ append file nếu người dùng có chọn ảnh
      if (formData.imageFile) {
        data.append('image', formData.imageFile); // 'image' phải trùng với upload.single('image') ở backend
      }

      // Gửi Request
      const res = await axios.post('http://localhost:5000/api/tasks', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        alert('Tạo task thành công!');
        // Refresh lại list task
        fetchTasks();
        setModalView('list');
      }
    } catch (error) {
      console.error('Lỗi tạo task:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa?')) {
      // Gọi API xóa (Bạn cần làm thêm API delete bên backend)
      // await axios.delete(...)
      console.log('Delete logic here for ID:', id);
    }
  };

  // --- RENDER HELPERS ---

  const renderListView = () => (
    <>
      <div className={styles.modalHeader} style={{ borderBottom: 'none' }}>
        <h3>
          Công việc ngày {selectedDate && format(selectedDate, 'dd/MM/yyyy')}
        </h3>
        <button onClick={() => setIsModalOpen(false)}>
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
            {/* Hiển thị ảnh nhỏ nếu có */}
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
            <button
              className={styles.deleteBtn}
              onClick={() => handleDeleteTask(task._id)}
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
    </>
  );

  const renderFormView = () => (
    <>
      <div className={styles.formHeader}>
        <h3>Add New Task</h3>
        <button
          className={styles.goBackBtn}
          onClick={() => setModalView('list')}
        >
          Go Back
        </button>
      </div>

      <div className={styles.formBody}>
        {/* Title */}
        <div className={styles.formGroup}>
          <label>Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Enter task title"
          />
        </div>

        {/* Date & Category (New Row) */}
        <div className={styles.formRow}>
          <div className={styles.leftColumn} style={{ flex: 1 }}>
            <div className={styles.formGroup}>
              <label>Date</label>
              {/* THAY ĐỔI Ở ĐÂY: Dùng input type="date" */}
              <input
                type="date"
                className={styles.dateInput} // Cần thêm class này vào CSS nhé
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  outline: 'none',
                  fontFamily: 'inherit',
                  color: 'var(--text-main)',
                }}
              />
            </div>
          </div>
          <div className={styles.rightColumn} style={{ flex: 1 }}>
            {/* THÊM PHẦN CHỌN CATEGORY */}
            <div className={styles.formGroup}>
              <label>Category</label>
              <select
                className={styles.selectInput} // Bạn cần thêm class này vào css hoặc dùng tạm input style
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  outline: 'none',
                }}
              >
                <option value="">Select Category</option>
                {MOCK_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Priority */}
        <div className={styles.formGroup}>
          <label>Priority</label>
          <div className={styles.priorityGroup}>
            {[
              { label: 'Extreme', color: '#ef4444', value: 'extreme' },
              { label: 'Moderate', color: '#3b82f6', value: 'moderate' },
              { label: 'Low', color: '#22c55e', value: 'low' },
            ].map((option) => (
              <div
                key={option.value}
                className={`${styles.priorityOption} ${
                  formData.priority === option.value ? styles.active : ''
                }`}
                onClick={() =>
                  setFormData({ ...formData, priority: option.value as any })
                }
              >
                <span
                  className={styles.dot}
                  style={{ backgroundColor: option.color }}
                />
                <span>{option.label}</span>
                <div className={styles.checkbox}>
                  {formData.priority === option.value && (
                    <Check size={12} color="white" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desc & Image */}
        <div className={styles.formRow}>
          <div className={styles.leftColumn}>
            <div className={styles.formGroup}>
              <label>Task Description</label>
              <textarea
                placeholder="Start writing here..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
          </div>

          <div className={styles.rightColumn}>
            <div className={styles.formGroup}>
              <label>Upload Image</label>
              <div
                className={styles.uploadBox}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  hidden
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {formData.imagePreview ? (
                  <img
                    src={formData.imagePreview}
                    alt="Preview"
                    className={styles.previewImage}
                  />
                ) : (
                  <>
                    <ImageIcon size={32} className={styles.uploadIcon} />
                    <p>
                      Drag&Drop files here <b>Or</b>
                    </p>
                    <button className={styles.browseBtn}>Browse</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          className={styles.doneBtn}
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Done'}
        </button>
      </div>
    </>
  );

  // --- MAIN RENDER ---
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: 30,
      }}
    >
      <div className={styles.calendarContainer}>
        {/* HEADER & GRID... (Giữ nguyên như code cũ) */}
        <div className={styles.header}>
          {/* ... code cũ giữ nguyên ... */}
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

        <div className={styles.weekDaysGrid}>
          {weekDays.map((day) => (
            <div key={day} className={styles.weekDayCell}>
              {day}
            </div>
          ))}
        </div>

        <div className={styles.daysGrid}>
          {calendarDays.map((day, index) => {
            // Filter task theo ngày (so sánh dueDate với day)
            const dayTasks = tasks.filter((t) =>
              isSameDay(new Date(t.dueDate), day)
            );
            const isCurrentMonth = isSameMonth(day, monthStart);
            return (
              <div
                key={index}
                className={`${styles.dayCell} ${
                  !isCurrentMonth ? styles.disabled : ''
                } ${isToday(day) ? styles.today : ''}`}
                onClick={() => handleDayClick(day)}
              >
                <div className={styles.dateNumber}>{format(day, 'd')}</div>
                <div className={styles.taskPreviewList}>
                  {dayTasks.slice(0, 2).map((t) => (
                    <div key={t._id} className={styles.taskDot} title={t.title}>
                      {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <div className={styles.moreTasks}>
                      +{dayTasks.length - 2} nữa
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* MODAL */}
        {isModalOpen && selectedDate && (
          <div
            className={styles.modalOverlay}
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              {modalView === 'list' ? renderListView() : renderFormView()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
