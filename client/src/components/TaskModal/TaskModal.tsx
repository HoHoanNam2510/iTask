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
// 👇 [MỚI] Import TimeTracker
import TimeTracker from './TimeTracker/TimeTracker';

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

  // 👇 [MỚI] State lưu data task mới nhất để cập nhật TimeTracker realtime
  const [currentTask, setCurrentTask] = useState<ITaskResponse | null>(null);

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

  // State Checklist & Attachments
  const [subtasks, setSubtasks] = useState<
    { title: string; isCompleted: boolean; _id?: string }[]
  >([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const [newAttachmentFiles, setNewAttachmentFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const dateString = format(defaultDate, 'yyyy-MM-dd');

  // --- INIT ---
  useEffect(() => {
    if (isOpen) {
      let targetCategoryId = defaultCategoryId;

      // Update currentTask state
      if (taskToEdit) {
        setCurrentTask(taskToEdit); // Init state
        if (typeof taskToEdit.category === 'string') {
          targetCategoryId = taskToEdit.category;
        } else if (
          taskToEdit.category &&
          typeof taskToEdit.category === 'object'
        ) {
          targetCategoryId = (taskToEdit.category as any)._id;
        }
      } else {
        setCurrentTask(null);
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

      if (taskToEdit) {
        setSubtasks(taskToEdit.subtasks || []);
        setExistingAttachments(taskToEdit.attachments || []);
      } else {
        setSubtasks([]);
        setExistingAttachments([]);
      }
      setNewAttachmentFiles([]);
      setNewSubtaskTitle('');
      setIsDragOver(false);

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
          setAssigneeId(user?._id || '');
        }
      } else {
        setAssigneeId(user?._id || '');
      }
    }
  }, [isOpen, taskToEdit, defaultCategoryId, dateString, user?._id]);

  // 👇 [MỚI] Hàm reload data task để update TimeTracker
  const handleReloadTask = async () => {
    if (!taskToEdit) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `http://localhost:5000/api/tasks/${taskToEdit._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setCurrentTask(res.data.task);
        onSuccess(); // Refresh list bên ngoài luôn
      }
    } catch (error) {
      console.error('Reload task error', error);
    }
  };

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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setFormData({ ...formData, imagePreview: url, imageFile: file });
      } else {
        alert('Vui lòng chỉ thả file ảnh!');
      }
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setNewAttachmentFiles((prev) => [...prev, ...filesArray]);
    }
  };
  const removeNewAttachment = (index: number) => {
    setNewAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
  };
  const handleRemoveExisting = (attId: string) => {
    setExistingAttachments((prev) => prev.filter((item) => item._id !== attId));
  };

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

      data.append('subtasks', JSON.stringify(subtasks));
      data.append('existingAttachments', JSON.stringify(existingAttachments));
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
              spellCheck={false}
            />
          </div>

          {/* Date & Category */}
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

          {/* Assignee */}
          {groupMembers.length > 0 && (
            <div className={cx('formGroup')}>
              <label>Giao việc cho (Assignee)</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className={cx('input')}
              >
                <option value={user?._id}>Chính tôi ({user?.username})</option>
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

          {/* Checklist */}
          <div className={cx('formGroup')}>
            <div className={cx('sectionLabel')}>
              <label>Checklist</label>
              {subtasks.length > 0 && (
                <span className={cx('progressText')}>
                  {calculateProgress()}%
                </span>
              )}
            </div>
            <div className={cx('progressBarContainer')}>
              {subtasks.length > 0 && (
                <div
                  className={cx('progressBarFill')}
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              )}
            </div>
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

          {/* Description & Attachments & Image */}
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
              <div className={cx('formGroup')}>
                <label>File Attachments</label>
                {existingAttachments.map((att) => (
                  <div key={att._id} className={cx('attachmentItem')}>
                    <FileText size={16} className={cx('fileIcon')} />
                    <a
                      href={`http://localhost:5000/${att.url}`}
                      target="_blank"
                      rel="noreferrer"
                      className={cx('fileName')}
                    >
                      {att.name}
                    </a>
                    <div className={cx('actionGroup')}>
                      <a
                        href={`http://localhost:5000/${att.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className={cx('actionBtn', 'download')}
                        title="Download"
                      >
                        <Download size={14} />
                      </a>
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

            <div className={cx('rightColumn')}>
              <div className={cx('formGroup')}>
                <label>Cover Image</label>
                <div
                  className={cx('uploadBox', { dragOver: isDragOver })}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
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
                        {isDragOver
                          ? 'Drop image here!'
                          : 'Drag&Drop cover here Or'}
                      </p>
                      {!isDragOver && (
                        <button className={cx('browseBtn')}>Browse</button>
                      )}
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

          {/* 👇 [MỚI] Time Tracker Component */}
          {currentTask && (
            <TimeTracker
              taskId={currentTask._id}
              taskData={currentTask}
              onUpdate={handleReloadTask}
            />
          )}

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
