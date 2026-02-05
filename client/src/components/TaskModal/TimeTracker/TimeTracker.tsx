/* client/src/components/TaskModal/TimeTracker/TimeTracker.tsx */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Square, Clock } from 'lucide-react';
import classNames from 'classnames/bind';
import httpRequest from '~/utils/httpRequest';
import styles from './TimeTracker.module.scss';
import type { ITaskResponse } from '~/types/task';
import { useAuth } from '~/context/AuthContext';
import { getImageUrl } from '~/utils/imageHelper';

const cx = classNames.bind(styles);

// Interface User cơ bản để map dữ liệu
interface UserBasic {
  _id: string;
  username: string;
  avatar?: string;
  email?: string;
}

interface TimeTrackerProps {
  taskId: string;
  taskData: ITaskResponse;
  onUpdate: () => void;
  members?: UserBasic[]; // 👇 [MỚI] Nhận danh sách thành viên để lookup tên
}

// Helper: Format giây thành HH:mm:ss
export const formatDuration = (totalSeconds: number) => {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const TimeTracker: React.FC<TimeTrackerProps> = ({
  taskId,
  taskData,
  onUpdate,
  members = [], // Mặc định rỗng
}) => {
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [localTicker, setLocalTicker] = useState(0);

  const tickerRef = useRef<any>(null);

  // 1. Tìm active entry (đang chạy)
  const activeEntry = taskData.timeEntries?.find((entry) => {
    const entryUserId =
      typeof entry.user === 'string' ? entry.user : entry.user._id;
    return !entry.endTime && entryUserId === currentUser?._id;
  });

  // 2. Logic đồng hồ đếm (đã fix lỗi âm thời gian)
  useEffect(() => {
    if (activeEntry) {
      const start = new Date(activeEntry.startTime).getTime();
      const updateTicker = () => {
        const now = Date.now();
        const diff = Math.floor((now - start) / 1000);
        setLocalTicker(Math.max(0, diff));
      };
      updateTicker();
      tickerRef.current = setInterval(updateTicker, 1000);
    } else {
      setLocalTicker(0);
      if (tickerRef.current) clearInterval(tickerRef.current);
    }
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, [activeEntry]);

  // 3. Gộp nhóm lịch sử theo User (Đã nâng cấp logic lookup)
  const groupedHistory = useMemo(() => {
    if (!taskData.timeEntries) return [];

    const map = new Map<
      string,
      {
        user: any; // User Object hoặc String ID
        totalSeconds: number;
        isRunning: boolean;
        lastActive: string;
      }
    >();

    taskData.timeEntries.forEach((entry) => {
      // --- LOGIC GIẢI MÃ USER ---
      let userId: string;
      let userObj: any = null;

      if (typeof entry.user === 'object' && entry.user !== null) {
        // Trường hợp 1: Backend đã populate sẵn (ngon lành)
        userId = entry.user._id;
        userObj = entry.user;
      } else {
        // Trường hợp 2: Chỉ có ID (TaskModal hay bị dính cái này)
        userId = entry.user as string;

        // Thử tìm trong danh sách members được truyền vào
        const foundMember = members.find((m) => m._id === userId);
        if (foundMember) {
          userObj = foundMember;
        }
        // Thử xem có phải chính mình không
        else if (currentUser && currentUser._id === userId) {
          userObj = currentUser;
        }
      }
      // ---------------------------

      if (!map.has(userId)) {
        map.set(userId, {
          user: userObj || userId, // Nếu không tìm được thì đành lưu ID
          totalSeconds: 0,
          isRunning: false,
          lastActive: entry.startTime,
        });
      }

      const record = map.get(userId)!;

      // Nếu record đang lưu string mà giờ tìm được object xịn hơn thì update
      if (typeof record.user === 'string' && userObj) {
        record.user = userObj;
      }

      // Cộng thời gian
      record.totalSeconds += Math.floor((entry.duration || 0) / 1000);

      // Xử lý đang chạy
      if (!entry.endTime) {
        record.isRunning = true;
        if (userId === currentUser?._id) {
          record.totalSeconds += localTicker;
        } else {
          const diffSeconds = Math.floor(
            (Date.now() - new Date(entry.startTime).getTime()) / 1000
          );
          record.totalSeconds += Math.max(0, diffSeconds);
        }
      }

      if (new Date(entry.startTime) > new Date(record.lastActive)) {
        record.lastActive = entry.startTime;
      }
    });

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
    );
  }, [taskData.timeEntries, localTicker, currentUser?._id, members]);

  const totalTaskSeconds = groupedHistory.reduce(
    (sum, item) => sum + item.totalSeconds,
    0
  );

  // --- ACTIONS ---
  const handleStart = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      await httpRequest.post(
        `/api/tasks/${taskId}/timer/start`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onUpdate();
    } catch (error) {
      console.error('Start timer error', error);
      alert('Không thể bắt đầu bấm giờ.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      await httpRequest.post(
        `/api/tasks/${taskId}/timer/stop`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onUpdate();
    } catch (error) {
      console.error('Stop timer error', error);
      alert('Lỗi khi dừng bấm giờ.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cx('timeTracker')}>
      <div className={cx('header')}>
        <h4>
          <Clock size={18} /> Time Tracking
        </h4>
        <span className={cx('totalTimeBadge')}>
          Total: {formatDuration(totalTaskSeconds)}
        </span>
      </div>

      <div className={cx('trackerBox')}>
        <div className={cx('timerDisplay', { active: !!activeEntry })}>
          {activeEntry ? formatDuration(localTicker) : '00:00:00'}
        </div>

        {activeEntry ? (
          <button
            className={cx('actionBtn', 'stop')}
            onClick={handleStop}
            disabled={isLoading}
          >
            <Square size={16} fill="currentColor" /> Stop Timer
          </button>
        ) : (
          <button
            className={cx('actionBtn', 'start')}
            onClick={handleStart}
            disabled={isLoading}
          >
            <Play size={16} fill="currentColor" /> Start Timer
          </button>
        )}
      </div>

      {groupedHistory.length > 0 && (
        <div className={cx('historyList')}>
          {groupedHistory.map((item, index) => {
            // Kiểm tra item.user là object hay string
            const isUserObject = typeof item.user !== 'string';

            // Lấy thông tin hiển thị
            const userName = isUserObject ? item.user.username : 'Unknown User';
            const userAvatar = isUserObject ? item.user.avatar : null;
            const userId = isUserObject ? item.user._id : item.user;

            return (
              <div key={userId || index} className={cx('historyItem')}>
                <div className={cx('userInfo')}>
                  <div className={cx('avatar')}>
                    {userAvatar ? (
                      <img src={getImageUrl(userAvatar)} alt="avt" />
                    ) : (
                      <div className={cx('placeholderAvatar')}>
                        {/* Fallback avatar chữ cái */}
                        {userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className={cx('name')}>{userName}</span>
                    {item.isRunning && (
                      <span
                        style={{
                          fontSize: 11,
                          color: '#ef4444',
                          fontWeight: 600,
                        }}
                      >
                        Working now...
                      </span>
                    )}
                  </div>
                </div>

                <div className={cx('duration')}>
                  {formatDuration(item.totalSeconds)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TimeTracker;
