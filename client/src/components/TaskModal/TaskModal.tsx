/* src/components/TaskModal/TaskModal.tsx */
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import {
  Check,
  Image as ImageIcon,
  Plus,
  Trash2,
  Paperclip,
  FileText,
  Download,
  X,
} from 'lucide-react';
import classNames from 'classnames/bind';
import styles from './TaskModal.module.scss';
import type { UserBasic } from '~/types/user';
import type { ITaskResponse } from '~/types/task';
import { useAuth } from '~/context/AuthContext';
import CommentSection from './CommentSection/CommentSection';

const cx = classNames.bind(styles);

interface ICategory {
  _id: string;
  name: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDate?: Date;
  defaultCategoryId?: string;
  taskToEdit?: ITaskResponse | null;
  groupMembers?: UserBasic[];
  groupId?: string;
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultDate = new Date(),
  defaultCategoryId = '',
  taskToEdit = null,
  groupMembers = [],
  groupId,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [assigneeId, setAssigneeId] = useState('');

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

  // 👇 State cho Checklist & Attachments
  const [subtasks, setSubtasks] = useState<
    { title: string; isCompleted: boolean; _id?: string }[]
  >([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const [existingAttachments, setExistingAttachments] = useState<any[]>([]); // File cũ từ DB
  const [newAttachmentFiles, setNewAttachmentFiles] = useState<File[]>([]); // File mới chọn

  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const dateString = format(defaultDate, 'yyyy-MM-dd');

  // --- INIT ---
  useEffect(() => {
    if (isOpen) {
      // Logic category, assignee, form data cũ...
      let targetCategoryId = defaultCategoryId;
      if (taskToEdit) {
        if (typeof taskToEdit.category === 'string') {
          targetCategoryId = taskToEdit.category;
        } else if (
          taskToEdit.category &&
          typeof taskToEdit.category === 'object'
        ) {
          targetCategoryId = (taskToEdit.category as any)._id;
        }
      }

      setFormData({
        title: taskToEdit ? taskToEdit.title : '',
        description: taskToEdit?.description || '',
        priority: taskToEdit ? taskToEdit.priority : 'low',
        categoryId: targetCategoryId,
        date: taskToEdit
          ? format(new Date(taskToEdit.dueDate), 'yyyy-MM-dd')
          : dateString,
        imagePreview: taskToEdit?.image
          ? `http://localhost:5000/${taskToEdit.image}`
          : null,
        imageFile: null,
      });

      // Load Subtasks & Attachments
      if (taskToEdit) {
        setSubtasks(taskToEdit.subtasks || []);
        setExistingAttachments(taskToEdit.attachments || []);
      } else {
        setSubtasks([]);
        setExistingAttachments([]);
      }
      setNewAttachmentFiles([]);
      setNewSubtaskTitle('');

      fetchCategories();

      // Assignee Logic
      if (taskToEdit) {
        if (taskToEdit.assignee) {
          if (typeof taskToEdit.assignee === 'object') {
            setAssigneeId((taskToEdit.assignee as any)._id);
          } else {
            setAssigneeId(taskToEdit.assignee as string);
          }
        } else {
          setAssigneeId('');
        }
      } else {
        setAssigneeId('');
      }
    }
  }, [isOpen, taskToEdit, defaultCategoryId, dateString]);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFormData({ ...formData, imagePreview: url, imageFile: file });
    }
  };

  // Logic Attachments
  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setNewAttachmentFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeNewAttachment = (index: number) => {
    setNewAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Hàm xử lý xóa file cũ (Chỉ xóa trên giao diện, khi bấm Save mới xóa thật)
  const handleRemoveExisting = (attId: string) => {
    setExistingAttachments((prev) => prev.filter((item) => item._id !== attId));
  };

  // Logic Checklist
  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([...subtasks, { title: newSubtaskTitle, isCompleted: false }]);
    setNewSubtaskTitle('');
  };

  const toggleSubtask = (index: number) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index].isCompleted = !newSubtasks[index].isCompleted;
    setSubtasks(newSubtasks);
  };

  const deleteSubtask = (index: number) => {
    const newSubtasks = subtasks.filter((_, i) => i !== index);
    setSubtasks(newSubtasks);
  };

  const calculateProgress = () => {
    if (subtasks.length === 0) return 0;
    const completed = subtasks.filter((t) => t.isCompleted).length;
    return Math.round((completed / subtasks.length) * 100);
  };

  // --- SAVE ---
  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('Vui lòng nhập tiêu đề!');
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');

      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('priority', formData.priority);
      data.append('date', new Date(formData.date).toISOString());
      if (formData.categoryId) data.append('categoryId', formData.categoryId);
      if (formData.imageFile) data.append('image', formData.imageFile);

      if (groupId) {
        data.append('groupId', groupId);
        if (assigneeId) data.append('assignee', assigneeId);
      }

      // Append Subtasks
      data.append('subtasks', JSON.stringify(subtasks));

      // 👇 [FIXED] Gửi danh sách file cũ còn lại để server cập nhật (nếu backend hỗ trợ xử lý)
      data.append('existingAttachments', JSON.stringify(existingAttachments));

      // Append Attachments (Loop từng file)
      newAttachmentFiles.forEach((file) => {
        data.append('attachments', file);
      });

      let res;
      if (taskToEdit) {
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
        <div className={cx('formHeader')}>
          <h3>{taskToEdit ? 'Edit Task' : 'Add New Task'}</h3>
          <button className={cx('closeBtn')} onClick={onClose}>
            Go Back
          </button>
        </div>

        <div className={cx('formBody')}>
          {/* 1. Title */}
          <div className={cx('formGroup')}>
            <label>Title</label>
            <input
              type="text"
              placeholder="Enter task title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              spellCheck={false}
            />
          </div>

          {/* 2. Date & Category */}
          <div className={cx('formRow')}>
            <div className={cx('leftColumn')} style={{ flex: 1 }}>
              <div className={cx('formGroup')}>
                <label>Due date</label>
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

          {/* 3. Assignee */}
          {groupMembers.length > 0 && (
            <div className={cx('formGroup')}>
              <label>Giao việc cho (Assignee)</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className={cx('input')}
              >
                <option value="">Chính tôi (Mặc định)</option>
                {groupMembers
                  .filter((u) => u._id !== user?._id)
                  .map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.username} ({u.email})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* 4. Priority */}
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

          {/* 5. CHECKLIST (SUBTASKS) */}
          <div className={cx('formGroup')}>
            <div className={cx('sectionLabel')}>
              <label>Checklist</label>
              {subtasks.length > 0 && (
                <span className={cx('progressText')}>
                  {calculateProgress()}%
                </span>
              )}
            </div>

            {/* Progress Bar */}
            {subtasks.length > 0 && (
              <div className={cx('progressBarContainer')}>
                <div
                  className={cx('progressBarFill')}
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
            )}

            {/* List */}
            <div className={cx('subtaskList')}>
              {subtasks.map((st, index) => (
                <div key={index} className={cx('subtaskItem')}>
                  <input
                    type="checkbox"
                    checked={st.isCompleted}
                    onChange={() => toggleSubtask(index)}
                  />
                  <span className={cx({ completed: st.isCompleted })}>
                    {st.title}
                  </span>
                  <button
                    onClick={() => deleteSubtask(index)}
                    className={cx('delSubtaskBtn')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New */}
            <div className={cx('addSubtaskBox')}>
              <input
                type="text"
                placeholder="Thêm công việc con..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
              />
              <button onClick={addSubtask} className={cx('addBtn')}>
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* 6. Description & Images & Attachments */}
          <div className={cx('formRow')}>
            {/* CỘT TRÁI: Description + Attachment List */}
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

              {/* Attachments Section */}
              <div className={cx('formGroup')}>
                <label>File Attachments</label>

                {/* File cũ */}
                {existingAttachments.map((att) => (
                  <div key={att._id} className={cx('attachmentItem')}>
                    <FileText size={16} className={cx('fileIcon')} />

                    {/* Tên file (Click để tải) */}
                    <a
                      href={`http://localhost:5000/${att.url}`}
                      target="_blank"
                      rel="noreferrer"
                      className={cx('fileName')}
                    >
                      {att.name}
                    </a>

                    {/* 👇 [MỚI] Group chứa các nút hành động (Download & Delete) */}
                    <div className={cx('actionGroup')}>
                      {/* Nút Download */}
                      <a
                        href={`http://localhost:5000/${att.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className={cx('actionBtn', 'download')}
                        title="Download"
                      >
                        <Download size={14} />
                      </a>

                      {/* Nút Delete */}
                      <button
                        type="button"
                        onClick={() => handleRemoveExisting(att._id)}
                        className={cx('actionBtn', 'delete')}
                        title="Remove file"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* File mới chọn */}
                {newAttachmentFiles.map((file, idx) => (
                  <div key={idx} className={cx('attachmentItem', 'new')}>
                    <Paperclip size={16} className={cx('fileIcon')} />
                    <span className={cx('fileName')}>{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeNewAttachment(idx)}
                      className={cx('removeFileBtn')}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                {/* Nút Upload */}
                <button
                  className={cx('uploadAttachmentBtn')}
                  onClick={() => attachmentInputRef.current?.click()}
                >
                  <Paperclip size={16} /> Attach Files
                </button>
                <input
                  type="file"
                  multiple
                  hidden
                  ref={attachmentInputRef}
                  onChange={handleAttachmentChange}
                />
              </div>
            </div>

            {/* CỘT PHẢI: Cover Image */}
            <div className={cx('rightColumn')}>
              <div className={cx('formGroup')}>
                <label>Cover Image</label>
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
                        Drag&Drop cover here <b>Or</b>
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

          {/* Comment Section */}
          {taskToEdit && (
            <CommentSection
              taskId={taskToEdit._id}
              currentUser={user}
              groupMembers={groupMembers}
              groupId={groupId}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
