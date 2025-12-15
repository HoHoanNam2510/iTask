import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Image as ImageIcon, Check } from 'lucide-react';
import classNames from 'classnames/bind';
import styles from './TaskModal.module.scss';
import type { ITaskResponse } from '~/types/task';
const cx = classNames.bind(styles);

interface ICategory {
  _id: string;
  name: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Callback để báo cho cha biết đã thêm xong để reload list
  defaultDate?: Date; // Nếu gọi từ Calendar thì truyền ngày vào
  defaultCategoryId?: string; // Nếu gọi từ CategoryDetail thì truyền ID vào
  taskToEdit?: ITaskResponse | null;
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultDate = new Date(),
  defaultCategoryId = '',
  taskToEdit = null,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<ICategory[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'low' as 'low' | 'moderate' | 'extreme',
    categoryId: defaultCategoryId,
    date: format(defaultDate, 'yyyy-MM-dd'),
    imagePreview: null as string | null,
    imageFile: null as File | null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- [FIX] LOGIC KHỞI TẠO DỮ LIỆU ---
  // Tạo biến chuỗi ngày để dùng trong dependency (tránh vòng lặp do object Date thay đổi)
  const dateString = format(defaultDate, 'yyyy-MM-dd');

  // --- [QUAN TRỌNG] SỬA USE EFFECT ---
  // Để tự động điền dữ liệu khi mở modal ở chế độ Edit
  useEffect(() => {
    if (isOpen) {
      // Logic xác định Category ID:
      // - Nếu đang Edit: Lấy từ task cũ (nếu có)
      // - Nếu đang Tạo mới: Lấy từ defaultCategoryId (được truyền từ CategoryDetail)
      const targetCategoryId = taskToEdit
        ? taskToEdit.category || ''
        : defaultCategoryId;

      setFormData({
        title: taskToEdit ? taskToEdit.title : '',
        description: taskToEdit?.description || '',
        priority: taskToEdit ? taskToEdit.priority : 'low',

        // 👇 Quan trọng: Đảm bảo lấy đúng ID
        categoryId: targetCategoryId,

        date: taskToEdit
          ? format(new Date(taskToEdit.dueDate), 'yyyy-MM-dd')
          : dateString,

        imagePreview: taskToEdit?.image
          ? `http://localhost:5000/${taskToEdit.image}`
          : null,
        imageFile: null,
      });

      // Log để kiểm tra xem Category ID có nhận được không
      console.log('🛠 Modal Opened. Category ID set to:', targetCategoryId);

      fetchCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, taskToEdit, defaultCategoryId, dateString]);
  // 👆 Thêm đầy đủ dependency (dùng dateString thay vì defaultDate object)

  // 2. Fetch danh sách Category để đổ vào Select
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data.categories || []);
    } catch (error) {
      console.error('Lỗi tải categories:', error);
    }
  };

  // 3. Xử lý ảnh
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFormData({ ...formData, imagePreview: url, imageFile: file });
    }
  };

  // 4. Submit Form
  // --- SỬA HÀM SAVE ĐỂ PHÂN BIỆT POST (Tạo) VÀ PUT (Sửa) ---
  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('Vui lòng nhập tiêu đề!');
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');

      // Chuẩn bị dữ liệu (giữ nguyên logic FormData cũ)
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('priority', formData.priority);
      data.append('date', new Date(formData.date).toISOString());
      if (formData.categoryId) data.append('categoryId', formData.categoryId);
      if (formData.imageFile) data.append('image', formData.imageFile);

      let res;
      if (taskToEdit) {
        // 👉 GỌI API UPDATE (PUT)
        res = await axios.put(
          `http://localhost:5000/api/tasks/${taskToEdit._id}`,
          data,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        // 👉 GỌI API CREATE (POST)
        res = await axios.post('http://localhost:5000/api/tasks', data, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });
      }

      if (res.data.success) {
        alert(taskToEdit ? 'Cập nhật thành công!' : 'Tạo task thành công!');
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Lỗi lưu task:', error);
      alert('Có lỗi xảy ra.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={cx('modalOverlay')} onClick={onClose}>
      <div className={cx('modalContent')} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={cx('formHeader')}>
          <h3>{taskToEdit ? 'Edit Task' : 'Add New Task'}</h3>
          <button className={cx('closeBtn')} onClick={onClose}>
            Go Back
          </button>
        </div>

        {/* Body */}
        <div className={cx('formBody')}>
          {/* Title */}
          <div className={cx('formGroup')}>
            <label>Title</label>
            <input
              type="text"
              placeholder="Enter task title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          {/* Date & Category */}
          <div className={cx('formRow')}>
            <div className={cx('leftColumn')} style={{ flex: 1 }}>
              <div className={cx('formGroup')}>
                <label>Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
            </div>
            <div className={cx('rightColumn')} style={{ flex: 1 }}>
              <div className={cx('formGroup')}>
                <label>Category</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  // Nếu đang ở trang detail category cụ thể thì disable chọn cái khác cho đỡ nhầm
                  disabled={!!defaultCategoryId}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Priority */}
          <div className={cx('formGroup')}>
            <label>Priority</label>
            <div className={cx('priorityGroup')}>
              {[
                { label: 'Extreme', color: '#ef4444', value: 'extreme' },
                { label: 'Moderate', color: '#3b82f6', value: 'moderate' },
                { label: 'Low', color: '#22c55e', value: 'low' },
              ].map((option) => (
                <div
                  key={option.value}
                  className={cx('priorityOption', {
                    active: formData.priority === option.value,
                  })}
                  onClick={() =>
                    setFormData({ ...formData, priority: option.value as any })
                  }
                >
                  <span
                    className={cx('dot')}
                    style={{ backgroundColor: option.color }}
                  />
                  <span>{option.label}</span>
                  <div className={cx('checkbox')}>
                    {formData.priority === option.value && (
                      <Check size={12} color="white" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desc & Image */}
          <div className={cx('formRow')}>
            <div className={cx('leftColumn')}>
              <div className={cx('formGroup')}>
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
            <div className={cx('rightColumn')}>
              <div className={cx('formGroup')}>
                <label>Upload Image</label>
                <div
                  className={cx('uploadBox')}
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
                      className={cx('previewImage')}
                    />
                  ) : (
                    <>
                      <ImageIcon size={32} className={cx('uploadIcon')} />
                      <p>
                        Drag&Drop files here <b>Or</b>
                      </p>
                      <button className={cx('browseBtn')}>Browse</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            className={cx('doneBtn')}
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
