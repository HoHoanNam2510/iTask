/* src/components/Leaderboard/Leaderboard.tsx */
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Trophy, Medal } from 'lucide-react';
import classNames from 'classnames/bind';
import styles from './Leaderboard.module.scss';

const cx = classNames.bind(styles);

interface LeaderboardItem {
  _id: string;
  username: string;
  avatar?: string;
  completedCount: number;
  badges?: Array<{ icon: string; name: string }>;
}

// 👇 [SỬA 1] Thêm prop refreshTrigger
interface LeaderboardProps {
  groupId: string;
  refreshTrigger?: number;
}

const Leaderboard = ({ groupId, refreshTrigger = 0 }: LeaderboardProps) => {
  const [leaders, setLeaders] = useState<LeaderboardItem[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!groupId) return;
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(
          `http://localhost:5000/api/groups/${groupId}/leaderboard`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          setLeaders(res.data.leaderboard);
        }
      } catch (error) {
        console.error('Lỗi tải BXH', error);
      }
    };
    fetchLeaderboard();
  }, [groupId, refreshTrigger]); // 👈 [SỬA 2] Thêm refreshTrigger vào đây

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy size={20} color="#d97706" fill="#fbbf24" />;
    if (index === 1) return <Medal size={20} color="#475569" />;
    if (index === 2) return <Medal size={20} color="#b45309" />;
    return <span className={cx('rankNum')}>{index + 1}</span>;
  };

  return (
    <div className={cx('leaderboardContainer')}>
      <h3 className={cx('title')}>
        <Trophy size={20} className={cx('icon')} />
        Bảng vàng thi đua
      </h3>

      <div className={cx('list')}>
        {leaders.length === 0 ? (
          <div className={cx('emptyState')}>
            Chưa có thành viên nào hoàn thành task. Hãy là người đầu tiên! 🚀
          </div>
        ) : (
          leaders.map((user, index) => (
            <div key={user._id} className={cx('item')}>
              <div
                className={cx('rank', {
                  top1: index === 0,
                  top2: index === 1,
                  top3: index === 2,
                })}
              >
                {getRankIcon(index)}
              </div>

              <div className={cx('userInfo')}>
                {user.avatar ? (
                  <img
                    src={`http://localhost:5000/${user.avatar.replace(
                      /\\/g,
                      '/'
                    )}`}
                    className={cx('avatar')}
                    alt="avt"
                  />
                ) : (
                  <div
                    className={cx('avatar')}
                    style={{
                      background: '#ccc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: '#fff',
                    }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className={cx('nameCol')}>
                  <span>{user.username}</span>
                  {user.badges && user.badges.length > 0 && (
                    <div className={cx('badgesRow')}>
                      {user.badges.map((b, i) => (
                        <span
                          key={i}
                          title={b.name}
                          style={{ fontSize: '1.2rem', cursor: 'help' }}
                        >
                          {b.icon}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={cx('score')}>
                {user.completedCount}
                <span>tasks</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
