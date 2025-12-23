/* src/components/TaskModal/TaskModal.tsx */
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import {
  Image as ImageIcon,
  Check,
  Send, // [MỚI] Icon gửi
  MessageSquare, // [MỚI] Icon chat
} from 'lucide-react';
import classNames from 'classnames/bind';
import styles from './TaskModal.module.scss';
import type { UserBasic } from '~/types/user';
import type { ITaskResponse } from '~/types/task';

const cx = classNames.bind(styles);

interface ICategory {
  _id: string;
  name: string;
}

// [MỚI] Interface cho Comment
interface IComment {
  _id: string;
  content: string;
  user: {
    _id: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
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

  // [MỚI] State cho Comments
  const [comments, setComments] = useState<IComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isCommentLoading, setIsCommentLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null); // [MỚI] Để scroll xuống dưới cùng

  const dateString = format(defaultDate, 'yyyy-MM-dd');

  // --- USE EFFECT KHỞI TẠO ---
  useEffect(() => {
    if (isOpen) {
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

      fetchCategories();

      if (taskToEdit) {
        setAssigneeId(taskToEdit.assignee || '');
        fetchComments(); // [MỚI] Tải comment nếu đang edit
      } else {
        setAssigneeId('');
        setComments([]); // [MỚI] Reset comment nếu tạo mới
      }
    }
  }, [isOpen, taskToEdit, defaultCategoryId, dateString]);

  // [MỚI] Cuộn xuống comment mới nhất
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // --- API CALLS ---
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

  // [MỚI] API Lấy comments
  const fetchComments = async () => {
    if (!taskToEdit) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `http://localhost:5000/api/comments/${taskToEdit._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data.success) {
        setComments(res.data.comments);
      }
    } catch (error) {
      console.error('Lỗi tải comment', error);
    }
  };

  // [MỚI] API Gửi comment
  const handleSendComment = async () => {
    if (!newComment.trim() || !taskToEdit) return;

    try {
      setIsCommentLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/comments',
        { taskId: taskToEdit._id, content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setComments([...comments, res.data.comment]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Lỗi gửi comment', error);
    } finally {
      setIsCommentLoading(false);
    }
  };

  // [MỚI] Xử lý phím Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFormData({ ...formData, imagePreview: url, imageFile: file });
    }
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
        if (assigneeId) {
          data.append('assignee', assigneeId);
        }
      }

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
        {/* Header */}
        <div className={cx('formHeader')}>
          <h3>{taskToEdit ? 'Edit Task' : 'Add New Task'}</h3>
          <button className={cx('closeBtn')} onClick={onClose}>
            Go Back
          </button>
        </div>

        {/* Body */}
        <div className={cx('formBody')}>
          {/* ... Form Inputs (Title, Date, Category...) GIỮ NGUYÊN ... */}
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

          {groupMembers.length > 0 && (
            <div className={cx('formGroup')}>
              <label>Giao việc cho (Assignee)</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className={cx('input')}
              >
                <option value="">Chính tôi (Mặc định)</option>
                {groupMembers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.username} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          )}

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

          {/* 👇 [PHẦN MỚI] KHU VỰC BÌNH LUẬN (Chỉ hiện khi đang Edit Task) */}
          {taskToEdit && (
            <div className={cx('commentSection')}>
              <div className={cx('divider')}></div>
              <h4 className={cx('sectionTitle')}>
                <MessageSquare size={18} /> Bình luận & Trao đổi
              </h4>

              <div className={cx('commentList')}>
                {comments.length === 0 ? (
                  <p className={cx('emptyComment')}>
                    Chưa có bình luận nào. Hãy bắt đầu trao đổi!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment._id} className={cx('commentItem')}>
                      {comment.user.avatar ? (
                        <img
                          src={`http://localhost:5000/${comment.user.avatar.replace(
                            /\\/g,
                            '/'
                          )}`}
                          className={cx('cmtAvatar')}
                          alt="avt"
                        />
                      ) : (
                        <div className={cx('cmtAvatarPlaceholder')}>
                          {comment.user.username.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className={cx('cmtContentBox')}>
                        <div className={cx('cmtHeader')}>
                          <span className={cx('cmtUser')}>
                            {comment.user.username}
                          </span>
                          <span className={cx('cmtTime')}>
                            {format(
                              new Date(comment.createdAt),
                              'dd/MM/yyyy - HH:mm'
                            )}
                          </span>
                        </div>
                        <p className={cx('cmtText')}>{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={commentsEndRef} />
              </div>

              <div className={cx('commentInputBox')}>
                <input
                  type="text"
                  placeholder="Viết bình luận... (Nhấn Enter để gửi)"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isCommentLoading}
                />
                <button
                  onClick={handleSendComment}
                  disabled={isCommentLoading || !newComment.trim()}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          )}
          {/* 👆 [HẾT PHẦN MỚI] */}
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
