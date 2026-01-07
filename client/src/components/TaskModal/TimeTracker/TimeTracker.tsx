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
  const [localTicker, setLocalTicker] = useState(0); // Số giây chạy hiển thị cho user hiện tại

  // Fix lỗi TypeScript 'NodeJS' namespace
  const tickerRef = useRef<any>(null);

  // 1. Tìm xem user hiện tại có đang chạy timer không
  const activeEntry = taskData.timeEntries?.find(
    (entry) => !entry.endTime && entry.user._id === user?._id
  );

  // 2. Logic đồng hồ đếm (Ticker) cho user hiện tại
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

  // 3. 👇 [LOGIC MỚI] Gộp nhóm lịch sử theo User
  const groupedHistory = useMemo(() => {
    if (!taskData.timeEntries) return [];

    const map = new Map<
      string,
      {
        user: (typeof taskData.timeEntries)[0]['user'];
        totalSeconds: number;
        isRunning: boolean;
        lastActive: string;
      }
    >();

    taskData.timeEntries.forEach((entry) => {
      const userId = entry.user._id;

      // Init nếu chưa có trong map
      if (!map.has(userId)) {
        map.set(userId, {
          user: entry.user,
          totalSeconds: 0,
          isRunning: false,
          lastActive: entry.startTime,
        });
      }

      const record = map.get(userId)!;

      // Cộng duration của các session đã kết thúc (Lưu ý: DB lưu ms, ta đổi ra giây)
      record.totalSeconds += Math.floor((entry.duration || 0) / 1000);

      // Nếu session này đang chạy (endTime = null)
      if (!entry.endTime) {
        record.isRunning = true;
        // Nếu là chính user đang login -> Cộng thêm localTicker
        if (userId === user?._id) {
          record.totalSeconds += localTicker;
        } else {
          // Nếu là người khác -> Tính khoảng cách từ start đến now
          const diffSeconds = Math.floor(
            (Date.now() - new Date(entry.startTime).getTime()) / 1000
          );
          record.totalSeconds += diffSeconds;
        }
      }

      // Cập nhật thời gian hoạt động gần nhất để sort
      if (new Date(entry.startTime) > new Date(record.lastActive)) {
        record.lastActive = entry.startTime;
      }
    });

    // Convert Map -> Array và Sort người mới làm lên đầu
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
    );
  }, [taskData.timeEntries, localTicker, user?._id]);

  // Tính tổng thời gian toàn bộ task (để hiển thị trên header)
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

      {/* Control Box: Chỉ hiện cho bản thân */}
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

      {/* Grouped History List */}
      {groupedHistory.length > 0 && (
        <div className={cx('historyList')}>
          {groupedHistory.map((item) => (
            <div key={item.user._id} className={cx('historyItem')}>
              <div className={cx('userInfo')}>
                <div className={cx('avatar')}>
                  {item.user.avatar ? (
                    <img
                      src={`http://localhost:5000/${item.user.avatar}`}
                      alt="avt"
                    />
                  ) : (
                    item.user.username?.charAt(0).toUpperCase()
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className={cx('name')}>{item.user.username}</span>
                  {/* Hiển thị trạng thái nếu đang chạy */}
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

              {/* Hiển thị TỔNG thời gian thay vì từng dòng */}
              <div className={cx('duration')}>
                {formatDuration(item.totalSeconds)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimeTracker;
