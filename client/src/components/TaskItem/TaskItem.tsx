/* src/components/TaskItem/TaskItem.tsx */
import React from 'react';
import classNames from 'classnames/bind';
import { format } from 'date-fns';
import {
  MoreHorizontal,
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

const formatDurationSimple = (ms: number) => {
  if (!ms) return '';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const TaskItem: React.FC<{
  task: ITaskResponse;
  isActive: boolean;
  onClick: () => void;
}> = ({ task, isActive, onClick }) => {
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks =
    task.subtasks?.filter((t) => t.isCompleted).length || 0;
  const totalComments = task.comments?.length || 0;
  const totalAttachments = task.attachments?.length || 0;
  const totalTime = task.totalTime || 0;

  return (
    <div className={cx('taskCard', { active: isActive })} onClick={onClick}>
      <div className={cx('cardHeader')}>
        <div className={cx('statusWrapper')}>
          {task.status === 'completed' ? (
            <CheckCircle2 size={16} className={cx('icon', 'done')} />
          ) : (
            <Clock size={16} className={cx('icon', 'process')} />
          )}
          <span className={cx('statusText')}>
            {task.status.replace('_', ' ')}
          </span>
        </div>
        <MoreHorizontal size={16} className={cx('moreIcon')} />
      </div>

      <h4 className={cx('taskTitle')}>{task.title}</h4>
      <p className={cx('taskDesc')}>{task.description || 'No description'}</p>

      {/* 👇 [RESTORED] Meta Info Row */}
      <div className={cx('taskMetaInfo')}>
        {totalSubtasks > 0 && (
          <div
            className={cx('metaItem', {
              done: completedSubtasks === totalSubtasks,
            })}
          >
            <CheckSquare size={14} />
            <span>
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
        )}
        {totalAttachments > 0 && (
          <div className={cx('metaItem')}>
            <Paperclip size={14} />
            <span>{totalAttachments}</span>
          </div>
        )}
        {totalComments > 0 && (
          <div className={cx('metaItem')}>
            <MessageSquare size={14} />
            <span>{totalComments}</span>
          </div>
        )}
      </div>

      <div className={cx('cardFooter')}>
        <div className={cx('footerLeft')}>
          <div className={cx('meta')}>
            <span className={cx('value', task.priority)}>{task.priority}</span>
          </div>
          {task.category && (
            <div
              className={cx('categoryBadge')}
              style={{ backgroundColor: task.category.color }}
            >
              {task.category.name}
            </div>
          )}
          {task.group && (
            <div className={cx('groupBadge')}>
              <Users size={12} />
              <span>{(task.group as any).name || 'Group'}</span>
            </div>
          )}
          {totalTime > 0 && (
            <div className={cx('timeBadge')}>
              <Clock size={12} />
              <span>{formatDurationSimple(totalTime)}</span>
            </div>
          )}
        </div>
        <div className={cx('date')}>
          {format(new Date(task.dueDate), 'dd/MM')}
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
