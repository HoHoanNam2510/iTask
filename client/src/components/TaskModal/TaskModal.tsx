/* src/components/TaskModal/TaskModal.tsx */
import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Calendar,
  Flag,
} from 'lucide-react';
import classNames from 'classnames/bind';
import styles from './TaskModal.module.scss';
import type { UserBasic } from '~/types/user';
import type { ITaskResponse } from '~/types/task';
import { useAuth } from '~/context/AuthContext';
import CommentSection from './CommentSection/CommentSection';
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
  defaultGroupId?: string;
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultDate = new Date(),
  defaultCategoryId = '',
  taskToEdit = null,
  groupMembers = [],
  defaultGroupId = '',
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [myGroups, setMyGroups] = useState<{ _id: string; name: string }[]>([]);

  // Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'moderate' | 'extreme'>(
    'low'
  );
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'completed'>(
    'todo'
  );
  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const [groupId, setGroupId] = useState(defaultGroupId);
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState(format(defaultDate, 'yyyy-MM-dd'));

  // Media & Subtasks
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const [newAttachmentFiles, setNewAttachmentFiles] = useState<File[]>([]);
  const [subtasks, setSubtasks] = useState<
    { title: string; isCompleted: boolean }[]
  >([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const [currentTask, setCurrentTask] = useState<ITaskResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const canDelete = useMemo(() => {
    if (!user || !taskToEdit || !taskToEdit.creator) return false;
    const cId =
      typeof taskToEdit.creator === 'object'
        ? taskToEdit.creator._id
        : taskToEdit.creator;
    return user.role === 'admin' || cId === user._id;
  }, [user, taskToEdit]);

  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      axios
        .get('http://localhost:5000/api/categories', { headers })
        .then((res) => setCategories(res.data.categories || []));
      axios
        .get('http://localhost:5000/api/groups/my-groups', { headers })
        .then((res) => setMyGroups(res.data.groups || []));

      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || '');
        setPriority(taskToEdit.priority);
        setStatus(taskToEdit.status);
        setDueDate(format(new Date(taskToEdit.dueDate), 'yyyy-MM-dd'));
        setCategoryId(
          taskToEdit.category
            ? typeof taskToEdit.category === 'object'
              ? taskToEdit.category._id
              : taskToEdit.category
            : ''
        );
        setGroupId(
          taskToEdit.group
            ? typeof taskToEdit.group === 'object'
              ? taskToEdit.group._id
              : taskToEdit.group
            : ''
        );
        setAssigneeId(
          taskToEdit.assignee
            ? typeof taskToEdit.assignee === 'object'
              ? taskToEdit.assignee._id
              : (taskToEdit.assignee as string)
            : ''
        );
        setImagePreview(
          taskToEdit.image ? `http://localhost:5000/${taskToEdit.image}` : null
        );
        setSubtasks(taskToEdit.subtasks || []);
        setExistingAttachments(taskToEdit.attachments || []);
        setCurrentTask(taskToEdit);
      } else {
        setTitle('');
        setDescription('');
        setPriority('low');
        setStatus('todo');
        setDueDate(format(defaultDate, 'yyyy-MM-dd'));
        setCategoryId(defaultCategoryId);
        setGroupId(defaultGroupId);
        setAssigneeId(user?._id || '');
        setImagePreview(null);
        setImageFile(null);
        setSubtasks([]);
        setExistingAttachments([]);
        setNewAttachmentFiles([]);
        setCurrentTask(null);
      }
    }
  }, [
    isOpen,
    taskToEdit,
    defaultDate,
    defaultCategoryId,
    defaultGroupId,
    user,
  ]);

  const handleReloadTask = async () => {
    if (!currentTask) return;
    const token = localStorage.getItem('token');
    const res = await axios.get(
      `http://localhost:5000/api/tasks/${currentTask._id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.data.success) {
      setCurrentTask(res.data.task);
      onSuccess();
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return alert('Tiêu đề không được để trống!');
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = new FormData();
      data.append('title', title);
      data.append('description', description);
      data.append('priority', priority);
      data.append('status', status);
      data.append('date', new Date(dueDate).toISOString());
      if (groupId) data.append('groupId', groupId);
      if (categoryId && !groupId) data.append('categoryId', categoryId);
      if (assigneeId) data.append('assignee', assigneeId);
      if (imageFile) data.append('image', imageFile);
      data.append('subtasks', JSON.stringify(subtasks));
      data.append('existingAttachments', JSON.stringify(existingAttachments));
      newAttachmentFiles.forEach((file) => data.append('attachments', file));

      const url = taskToEdit
        ? `http://localhost:5000/api/tasks/${taskToEdit._id}`
        : 'http://localhost:5000/api/tasks';
      await axios({
        method: taskToEdit ? 'put' : 'post',
        url,
        data,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      onSuccess();
      onClose();
    } catch (e) {
      alert('Lưu thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  // Subtask Helpers
  const addSubtask = () => {
    if (newSubtaskTitle.trim()) {
      setSubtasks([
        ...subtasks,
        { title: newSubtaskTitle, isCompleted: false },
      ]);
      setNewSubtaskTitle('');
    }
  };
  const toggleSubtask = (idx: number) => {
    const n = [...subtasks];
    n[idx].isCompleted = !n[idx].isCompleted;
    setSubtasks(n);
  };
  const removeSubtask = (idx: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== idx));
  };
  const calcProgress = () =>
    subtasks.length === 0
      ? 0
      : Math.round(
          (subtasks.filter((t) => t.isCompleted).length / subtasks.length) * 100
        );

  if (!isOpen) return null;

  return (
    <div className={cx('modalOverlay')} onClick={onClose}>
      <div className={cx('modalContent')} onClick={(e) => e.stopPropagation()}>
        <div className={cx('formHeader')}>
          <div className={cx('statusGroup')}>
            {['todo', 'in_progress', 'completed'].map((s) => (
              <button
                key={s}
                className={cx('statusBtn', s, { active: status === s })}
                onClick={() => setStatus(s as any)}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
          <button className={cx('closeBtn')} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className={cx('formBody')}>
          {/* Title */}
          <div className={cx('formGroup')}>
            <label>Title</label>
            <input
              className={cx('titleInput')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task Title"
            />
          </div>

          <div className={cx('formRow')}>
            <div className={cx('leftColumn')}>
              {/* 👇 [UPDATED] Input with Calendar Icon */}
              <div className={cx('formGroup')}>
                <label>Due date</label>
                <div className={cx('inputWithIcon')}>
                  <Calendar size={18} className={cx('icon')} />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
              <div className={cx('formGroup')}>
                <label>Group</label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  disabled={!!defaultGroupId}
                >
                  <option value="">Personal</option>
                  {myGroups.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={cx('rightColumn')}>
              <div className={cx('formGroup')}>
                <label>Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={!!groupId}
                >
                  <option value="">
                    {groupId ? 'N/A' : 'Select Category'}
                  </option>
                  {!groupId &&
                    categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              {/* 👇 [UPDATED] Input with Flag Icon */}
              <div className={cx('formGroup')}>
                <label>Priority</label>
                <div className={cx('inputWithIcon')}>
                  <Flag size={18} className={cx('icon')} />
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                  >
                    <option value="low">Low</option>
                    <option value="moderate">Moderate</option>
                    <option value="extreme">Extreme</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className={cx('formGroup')}>
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description..."
            />
          </div>

          {/* Checklist */}
          <div className={cx('formGroup')}>
            <div className={cx('sectionLabel')}>
              <label>Checklist</label>
              <span className={cx('progressText')}>{calcProgress()}%</span>
            </div>
            <div className={cx('progressBarContainer')}>
              <div
                className={cx('progressBarFill')}
                style={{ width: `${calcProgress()}%` }}
              ></div>
            </div>
            <div className={cx('subtaskList')}>
              {subtasks.map((st, i) => (
                <div key={i} className={cx('subtaskItem')}>
                  <input
                    type="checkbox"
                    checked={st.isCompleted}
                    onChange={() => toggleSubtask(i)}
                  />
                  <span className={cx({ completed: st.isCompleted })}>
                    {st.title}
                  </span>
                  <button
                    className={cx('delSubtaskBtn')}
                    onClick={() => removeSubtask(i)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className={cx('addSubtaskBox')}>
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add subtask..."
                onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
              />
              <button className={cx('addBtn')} onClick={addSubtask}>
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Attachments */}
          <div className={cx('formGroup')}>
            <label>Attachments</label>
            {existingAttachments.map((att) => (
              <div key={att._id} className={cx('attachmentItem')}>
                <FileText size={16} />{' '}
                <span className={cx('fileName')}>{att.name}</span>
                <div className={cx('actionGroup')}>
                  {/* 👇 [RESTORED] Nút Download */}
                  <a
                    href={`http://localhost:5000/${att.url}`}
                    target="_blank"
                    className={cx('actionBtn', 'download')}
                  >
                    <Download size={14} />
                  </a>
                  <button
                    className={cx('actionBtn', 'delete')}
                    onClick={() =>
                      setExistingAttachments((prev) =>
                        prev.filter((a) => a._id !== att._id)
                      )
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {newAttachmentFiles.map((f, i) => (
              <div key={i} className={cx('attachmentItem', 'new')}>
                <Paperclip size={16} />
                <span>{f.name}</span>
                <button
                  className={cx('removeFileBtn')}
                  onClick={() =>
                    setNewAttachmentFiles((prev) =>
                      prev.filter((_, idx) => idx !== i)
                    )
                  }
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              className={cx('uploadAttachmentBtn')}
              onClick={() => attachmentInputRef.current?.click()}
            >
              <Plus size={14} /> Attach File
            </button>
            <input
              type="file"
              hidden
              multiple
              ref={attachmentInputRef}
              onChange={(e) => {
                if (e.target.files)
                  setNewAttachmentFiles([
                    ...newAttachmentFiles,
                    ...Array.from(e.target.files),
                  ]);
              }}
            />
          </div>

          {/* Image Upload */}
          <div className={cx('formGroup')}>
            <label>Cover Image</label>
            <div
              className={cx('uploadBox', { dragOver: isDragOver })}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files[0]) {
                  setImagePreview(URL.createObjectURL(e.dataTransfer.files[0]));
                  setImageFile(e.dataTransfer.files[0]);
                }
              }}
            >
              <input
                type="file"
                hidden
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setImagePreview(URL.createObjectURL(e.target.files[0]));
                    setImageFile(e.target.files[0]);
                  }
                }}
                accept="image/*"
              />
              {imagePreview ? (
                <img src={imagePreview} className={cx('previewImage')} />
              ) : (
                <>
                  <ImageIcon size={32} className={cx('uploadIcon')} />
                  <p>Drop image or Browse</p>
                </>
              )}
            </div>
          </div>

          {currentTask && (
            <TimeTracker
              taskId={currentTask._id}
              taskData={currentTask}
              onUpdate={handleReloadTask}
            />
          )}

          <div className={cx('footerAction')}>
            {taskToEdit && canDelete && (
              <button
                className={cx('deleteBtn')}
                onClick={async () => {
                  if (!confirm('Xóa?')) return;
                  await axios.delete(
                    `http://localhost:5000/api/tasks/${taskToEdit._id}`,
                    {
                      headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                      },
                    }
                  );
                  onSuccess();
                  onClose();
                }}
              >
                Delete Task
              </button>
            )}
            <button
              className={cx('doneBtn')}
              onClick={handleSave}
              disabled={isLoading}
            >
              Done
            </button>
          </div>

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
