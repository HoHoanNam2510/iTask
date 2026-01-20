/* client/src/components/VideoRoom/VideoRoom.tsx */
import React, { useEffect, useRef, useState } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import axios from 'axios';
import styles from './VideoRoom.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

interface VideoRoomProps {
  roomId: string;
  userId: string;
  userName: string;
  groupName?: string;
  onLeave: () => void;
}

const VideoRoom: React.FC<VideoRoomProps> = ({
  roomId,
  userId,
  userName,
  groupName,
  onLeave,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const zpInstanceRef = useRef<any>(null); // Lưu instance để destroy
  const [isJoined, setIsJoined] = useState(false);

  // 1. Gửi thông báo mời họp (Chỉ chạy 1 lần)
  useEffect(() => {
    const sendNotification = async () => {
      try {
        const token = localStorage.getItem('token');
        if (groupName && token) {
          await axios.post(
            'http://localhost:5000/api/notifications/meeting',
            { groupId: roomId, groupName },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      } catch (error) {
        console.error('Không thể gửi thông báo họp:', error);
      }
    };
    sendNotification();
  }, []);

  // 2. Logic khởi tạo Zego
  useEffect(() => {
    let isMounted = true;

    const initMeeting = async () => {
      if (!containerRef.current || isJoined) return;

      try {
        const authToken = localStorage.getItem('token');

        // 👇 [FIXED] Tạo session ID ngẫu nhiên để tránh lỗi "1002001 login rooms limit"
        // Ví dụ: 693be..._1732456789
        const sessionUserId = `${userId}_${Math.floor(Math.random() * 10000)}`;

        // Gọi API lấy token cho session ID này
        const res = await axios.get(
          `http://localhost:5000/api/system/zego-token?userId=${sessionUserId}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );

        if (!res.data.success || !isMounted) return;

        const { token, appID, userId: finalUserId } = res.data;

        // Tạo Kit Token với ID khớp 100% server trả về
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
          appID,
          token,
          roomId,
          finalUserId,
          userName
        );

        // Khởi tạo Zego
        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpInstanceRef.current = zp;

        zp.joinRoom({
          container: containerRef.current,
          sharedLinks: [
            {
              name: 'Copy Link',
              url: window.location.href,
            },
          ],
          scenario: {
            mode: ZegoUIKitPrebuilt.GroupCall,
          },
          showPreJoinView: false,
          onLeaveRoom: () => {
            onLeave();
          },
        });

        setIsJoined(true);
      } catch (error) {
        console.error('Failed to init Zego:', error);
        alert('Lỗi kết nối Video Call');
        onLeave();
      }
    };

    initMeeting();

    // 👇 [FIXED] Cleanup quan trọng để tránh lỗi React StrictMode render 2 lần
    return () => {
      isMounted = false;
      if (zpInstanceRef.current) {
        zpInstanceRef.current.destroy();
        zpInstanceRef.current = null;
      }
    };
  }, [roomId, userId, userName, onLeave]);

  return (
    <div className={cx('videoRoomOverlay')}>
      <div ref={containerRef} className={cx('zegoContainer')} />
    </div>
  );
};

export default VideoRoom;
