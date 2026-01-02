/* src/components/TaskModal/CommentSection/CommentSection.tsx */
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Send, Edit2, Trash2, MessageSquare, Check, X } from 'lucide-react';
import classNames from 'classnames/bind';
import styles from './CommentSection.module.scss';
import type { UserBasic } from '~/types/user';

const cx = classNames.bind(styles);

// Interface nội bộ cho Comment
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

interface CommentSectionProps {
  taskId: string; // ID của Task đang mở
  currentUser: UserBasic | null; // User đang đăng nhập
  groupMembers: UserBasic[]; // List thành viên để mention
  groupId?: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  taskId,
  currentUser,
  groupMembers,
  groupId,
}) => {
  const [comments, setComments] = useState<IComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isCommentLoading, setIsCommentLoading] = useState(false);

  // Mention State
  const [showMentionList, setShowMentionList] = useState(false);
  const [filteredMembers, setFilteredMembers] = useState<UserBasic[]>([]);

  // Edit State
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Load comments khi taskId thay đổi
  useEffect(() => {
    if (taskId) {
      fetchComments();
    }
  }, [taskId]);

  // Cuộn xuống dưới cùng khi có comment mới
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `http://localhost:5000/api/comments/${taskId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setComments(res.data.comments);
      }
    } catch (error) {
      console.error('Lỗi tải comment', error);
    }
  };

  // --- MENTION LOGIC ---
  const mentionableUsers =
    groupId && groupMembers.length > 0
      ? groupMembers.filter((member) => member._id !== currentUser?._id)
      : [];

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewComment(val);

    const lastWord = val.split(' ').pop();
    if (lastWord && lastWord.startsWith('@') && mentionableUsers.length > 0) {
      const query = lastWord.slice(1).toLowerCase();
      const matches = mentionableUsers.filter((m) =>
        m.username.toLowerCase().includes(query)
      );

      if (matches.length > 0) {
        setFilteredMembers(matches);
        setShowMentionList(true);
        return;
      }
    }
    setShowMentionList(false);
  };

  const handleSelectMention = (username: string) => {
    const words = newComment.split(' ');
    words.pop();
    const newVal = [...words, `@${username} `].join(' ');
    setNewComment(newVal);
    setShowMentionList(false);
  };

  const renderCommentContent = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className={cx('mentionHighlight')}>
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // --- CRUD OPERATIONS ---
  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    try {
      setIsCommentLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/comments',
        { taskId: taskId, content: newComment },
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

  const handleStartEdit = (comment: IComment) => {
    setEditingCommentId(comment._id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `http://localhost:5000/api/comments/${commentId}`,
        { content: editContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setComments((prev) =>
          prev.map((c) => (c._id === commentId ? res.data.comment : c))
        );
        handleCancelEdit();
      }
    } catch (error) {
      console.error('Lỗi update comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(
        `http://localhost:5000/api/comments/${commentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
      }
    } catch (error) {
      console.error('Lỗi xóa comment:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  };

  return (
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

              <div className={cx('cmtContentWrapper')}>
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

                  {editingCommentId === comment._id ? (
                    <div className={cx('editModeBox')}>
                      <input
                        autoFocus
                        className={cx('editInput')}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter')
                            handleUpdateComment(comment._id);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                      <div className={cx('editActions')}>
                        <button
                          onClick={() => handleUpdateComment(comment._id)}
                          className={cx('saveEditBtn')}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className={cx('cancelEditBtn')}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={cx('cmtBody')}>
                      <p className={cx('cmtText')}>
                        {renderCommentContent(comment.content)}
                      </p>
                      {currentUser?._id === comment.user._id && (
                        <div className={cx('cmtActions')}>
                          <button
                            onClick={() => handleStartEdit(comment)}
                            className={cx('editBtn')}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className={cx('delBtn')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      <div className={cx('commentInputWrapper')}>
        {showMentionList && (
          <div className={cx('mentionPopup')}>
            {filteredMembers.map((user) => (
              <div
                key={user._id}
                className={cx('mentionItem')}
                onClick={() => handleSelectMention(user.username)}
              >
                <div className={cx('mentionAvatar')}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span>{user.username}</span>
              </div>
            ))}
          </div>
        )}
        <div className={cx('commentInputBox')}>
          <input
            type="text"
            placeholder="Viết bình luận... (gõ @ để tag tên)"
            value={newComment}
            onChange={handleCommentChange}
            onKeyDown={handleKeyDown}
            disabled={isCommentLoading}
          />
          <button onClick={handleSendComment} disabled={isCommentLoading}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentSection;
