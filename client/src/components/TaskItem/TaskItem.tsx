/* src/components/TaskItem/TaskItem.tsx */
import React from 'react';
import classNames from 'classnames/bind';
import { format } from 'date-fns';
import {
  MoreHorizontal,
  AlertCircle,
  CheckCircle2,
  Clock,
  Paperclip,
  CheckSquare,
  Users,
  MessageSquare,
} from 'lucide-react';
import styles from './TaskItem.module.scss';
import type { ITaskResponse } from '~/types/task';

const cx = classNames.bind(styles);

interface TaskItemProps {
  task: ITaskResponse;
  isActive: boolean;
  onClick: () => void;
}

// Helper format duration
const formatDurationSimple = (ms: number) => {
  if (!ms) return '';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const TaskItem: React.FC<TaskItemProps> = ({ task, isActive, onClick }) => {
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks =
    task.subtasks?.filter((t) => t.isCompleted).length || 0;

  const totalComments = task.comments?.length || 0;

  // 👇 [MỚI] Tổng thời gian
  const totalTime = task.totalTime || 0;

  const renderStatusIcon = () => {
    switch (task.status) {
      case 'todo':
        return <AlertCircle size={16} className={cx('icon', 'todo')} />;
      case 'in_progress':
        return <Clock size={16} className={cx('icon', 'process')} />;
      case 'completed':
        return <CheckCircle2 size={16} className={cx('icon', 'done')} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  return (
    <div className={cx('taskCard', { active: isActive })} onClick={onClick}>
      <div className={cx('cardHeader')}>
        <div className={cx('statusWrapper')}>
          {renderStatusIcon()}
          <span className={cx('statusText')}>
            {task.status.replace('_', ' ')}
          </span>
        </div>
        <MoreHorizontal size={16} className={cx('moreIcon')} />
      </div>

      <h4 className={cx('taskTitle')}>{task.title}</h4>

      <p className={cx('taskDesc')}>
        {task.description
          ? task.description.length > 60
            ? task.description.slice(0, 60) + '...'
            : task.description
          : 'No description'}
      </p>

      {/* Metadata Row: Checklist | Attachments */}
      {(totalSubtasks > 0 ||
        (task.attachments && task.attachments.length > 0)) && (
        <div className={cx('taskMetaInfo')}>
          {totalSubtasks > 0 && (
            <div
              className={cx('metaItem', {
                done: completedSubtasks === totalSubtasks,
              })}
              title="Checklist"
            >
              <CheckSquare size={14} />
              <span>
                {completedSubtasks}/{totalSubtasks}
              </span>
            </div>
          )}

          {task.attachments && task.attachments.length > 0 && (
            <div className={cx('metaItem')} title="Attachments">
              <Paperclip size={14} />
              <span>{task.attachments.length}</span>
            </div>
          )}
        </div>
      )}

      <div className={cx('cardFooter')}>
        <div className={cx('footerLeft')}>
          {/* Priority */}
          <div className={cx('meta')}>
            <span className={cx('value', task.priority)}>{task.priority}</span>
          </div>

          {/* Category Badge */}
          {task.category && (
            <div
              className={cx('categoryBadge')}
              style={{ backgroundColor: task.category.color || '#94a3b8' }}
              title={task.category.name}
            >
              {task.category.name}
            </div>
          )}

          {/* Group Badge */}
          {task.group && (
            <div className={cx('groupBadge')}>
              <Users size={12} />
              <span>{(task.group as any).name || 'Group'}</span>
            </div>
          )}

          {/* Comment Count */}
          {totalComments > 0 && (
            <div className={cx('commentBadge')} title="Comments">
              <MessageSquare size={14} />
              <span>{totalComments}</span>
            </div>
          )}

          {/* 👇 [MỚI] Time Badge */}
          {totalTime > 0 && (
            <div className={cx('timeBadge')} title="Total Time Tracked">
              <Clock size={12} />
              <span>{formatDurationSimple(totalTime)}</span>
            </div>
          )}
        </div>

        {task.dueDate && (
          <div className={cx('date')}>
            {format(new Date(task.dueDate), 'dd/MM')}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskItem;
