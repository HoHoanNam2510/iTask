/* client/src/components/TaskModal/TimeTracker/TimeTracker.tsx */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { Play, Square, Clock } from 'lucide-react';
import classNames from 'classnames/bind';
import styles from './TimeTracker.module.scss';
import type { ITaskResponse } from '~/types/task';
import { useAuth } from '~/context/AuthContext';

const cx = classNames.bind(styles);

interface TimeTrackerProps {
  taskId: string;
  taskData: ITaskResponse;
  onUpdate: () => void;
}

// Helper: Format giây thành HH:mm:ss
export const formatDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const TimeTracker: React.FC<TimeTrackerProps> = ({
  taskId,
  taskData,
  onUpdate,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [localTicker, setLocalTicker] = useState(0); // Số giây chạy hiển thị

  const tickerRef = useRef<any>(null);

  // 1. Tìm xem user hiện tại có đang chạy timer không
  const activeEntry = taskData.timeEntries?.find((entry) => {
    // 👇 Handle case entry.user could be string ID or Object
    const entryUserId =
      typeof entry.user === 'string' ? entry.user : entry.user._id;
    return !entry.endTime && entryUserId === user?._id;
  });

  // 2. Logic đồng hồ đếm
  useEffect(() => {
    if (activeEntry) {
      const start = new Date(activeEntry.startTime).getTime();
      const updateTicker = () => {
        const now = Date.now();
        setLocalTicker(Math.floor((now - start) / 1000));
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

  // 3. Gộp nhóm lịch sử theo User
  const groupedHistory = useMemo(() => {
    if (!taskData.timeEntries) return [];

    const map = new Map<
      string,
      {
        user: any; // Allow any to handle string | UserObject
        totalSeconds: number;
        isRunning: boolean;
        lastActive: string;
      }
    >();

    taskData.timeEntries.forEach((entry) => {
      // 👇 [FIX] Lấy userId an toàn
      const userId =
        typeof entry.user === 'string' ? entry.user : entry.user._id;

      // Init nếu chưa có trong map
      if (!map.has(userId)) {
        map.set(userId, {
          user: entry.user, // Lưu nguyên gốc để hiển thị avatar nếu có
          totalSeconds: 0,
          isRunning: false,
          lastActive: entry.startTime,
        });
      }

      const record = map.get(userId)!;

      // Update User Info nếu entry sau có data đầy đủ hơn (trường hợp load chậm)
      if (typeof record.user === 'string' && typeof entry.user !== 'string') {
        record.user = entry.user;
      }

      // Cộng duration
      record.totalSeconds += Math.floor((entry.duration || 0) / 1000);

      // Nếu session này đang chạy
      if (!entry.endTime) {
        record.isRunning = true;
        // Nếu là chính user đang login -> Cộng thêm localTicker
        if (userId === user?._id) {
          record.totalSeconds += localTicker;
        } else {
          // Người khác -> Tính diff time
          const diffSeconds = Math.floor(
            (Date.now() - new Date(entry.startTime).getTime()) / 1000
          );
          record.totalSeconds += diffSeconds;
        }
      }

      // Update last active
      if (new Date(entry.startTime) > new Date(record.lastActive)) {
        record.lastActive = entry.startTime;
      }
    });

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
    );
  }, [taskData.timeEntries, localTicker, user?._id]);

  const totalTaskSeconds = groupedHistory.reduce(
    (sum, item) => sum + item.totalSeconds,
    0
  );

  // --- ACTIONS ---
  const handleStart = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/tasks/${taskId}/timer/start`,
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
      await axios.post(
        `http://localhost:5000/api/tasks/${taskId}/timer/stop`,
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
            // Check nếu user là object hay string ID
            const isUserObject = typeof item.user !== 'string';
            const userId = isUserObject ? item.user._id : item.user;
            const userName = isUserObject ? item.user.username : 'Unknown User';

            return (
              <div key={userId || index} className={cx('historyItem')}>
                <div className={cx('userInfo')}>
                  <div className={cx('avatar')}>
                    {isUserObject && item.user.avatar ? (
                      <img
                        src={`http://localhost:5000/${item.user.avatar}`}
                        alt="avt"
                      />
                    ) : (
                      userName.charAt(0).toUpperCase()
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
