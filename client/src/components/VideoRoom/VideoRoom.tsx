/* client/src/components/VideoRoom/VideoRoom.tsx */
import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import axios from 'axios';
import { useSocket } from '~/context/SocketContext';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import styles from './VideoRoom.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

interface VideoRoomProps {
  roomId: string;
  userId: string;
  groupName?: string;
  onLeave: () => void;
}

const VideoRoom: React.FC<VideoRoomProps> = ({
  roomId,
  userId,
  groupName,
  onLeave,
}) => {
  const { socket } = useSocket();

  const [peers, setPeers] = useState<Record<string, any>>({});
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<
    { id: string; stream: MediaStream }[]
  >([]);

  // 👇 [QUAN TRỌNG] Dùng Ref để lưu stream, giúp cleanup được trong useEffect
  const streamRef = useRef<MediaStream | null>(null);

  // Controls State
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  const myVideoRef = useRef<HTMLVideoElement>(null);
  const peerInstance = useRef<Peer | null>(null);

  // 1. Gửi thông báo
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
  }, [roomId, groupName]);

  // 2. Logic WebRTC
  useEffect(() => {
    if (!socket) return;

    const peer = new Peer(userId, {
      host: 'localhost',
      port: 5000,
      path: '/peerjs/myapp',
    });
    peerInstance.current = peer;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        // 👇 Lưu vào Ref ngay lập tức để cleanup sau này
        streamRef.current = stream;
        setMyStream(stream);

        if (myVideoRef.current) {
          myVideoRef.current.srcObject = stream;
        }

        peer.on('call', (call) => {
          call.answer(stream);
          call.on('stream', (remoteStream) => {
            addRemoteStream(call.peer, remoteStream);
          });
        });

        socket.on('user-connected', (newUserId: string) => {
          connectToNewUser(newUserId, stream, peer);
        });
      })
      .catch((err) => {
        console.error('Failed to get media:', err);
        alert('Không thể truy cập Camera/Micro.');
      });

    peer.on('open', (id) => {
      socket.emit('join-room', roomId, id);
    });

    socket.on('user-disconnected', (disconnectedUserId: string) => {
      if (peers[disconnectedUserId]) {
        peers[disconnectedUserId].close();
      }
      setRemoteStreams((prev) =>
        prev.filter((s) => s.id !== disconnectedUserId)
      );
    });

    // 👇 [FIXED] Hàm dọn dẹp khi component unmount (Rời phòng)
    return () => {
      socket.off('user-connected');
      socket.off('user-disconnected');

      // Hủy Peer
      peer.destroy();

      // Tắt hoàn toàn Camera & Mic (Tắt đèn phần cứng)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop(); // Lệnh này sẽ tắt đèn camera
        });
        streamRef.current = null;
      }
    };
  }, [roomId, userId, socket]);

  // Helper: Thêm remote stream
  const addRemoteStream = (id: string, stream: MediaStream) => {
    setRemoteStreams((prev) => {
      if (prev.some((s) => s.id === id)) return prev;
      return [...prev, { id, stream }];
    });
  };

  // Helper: Gọi peer mới
  const connectToNewUser = (
    newUserId: string,
    stream: MediaStream,
    peer: Peer
  ) => {
    const call = peer.call(newUserId, stream);
    call.on('stream', (remoteStream) => {
      addRemoteStream(newUserId, remoteStream);
    });
    call.on('close', () => {
      setRemoteStreams((prev) => prev.filter((s) => s.id !== newUserId));
    });
    setPeers((prev) => ({ ...prev, [newUserId]: call }));
  };

  const toggleMic = () => {
    if (myStream) {
      const audioTrack = myStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
        setIsMicOn(!isMicOn);
      }
    }
  };

  const toggleCamera = () => {
    if (myStream) {
      const videoTrack = myStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCameraOn;
        setIsCameraOn(!isCameraOn);
      }
    }
  };

  return (
    <div className={cx('videoRoomOverlay')}>
      <div className={cx('videoGrid')}>
        <div className={cx('videoContainer', 'isSelf')}>
          <video ref={myVideoRef} autoPlay muted playsInline />
          <span className={cx('label')}>Bạn {isMicOn ? '' : '(Muted)'}</span>
        </div>

        {remoteStreams.map((item) => (
          <VideoPlayer key={item.id} stream={item.stream} peerId={item.id} />
        ))}
      </div>

      <div className={cx('controlsBar')}>
        <button
          onClick={toggleMic}
          className={cx('controlBtn', { inactive: !isMicOn })}
          title={isMicOn ? 'Tắt Mic' : 'Bật Mic'}
        >
          {isMicOn ? <Mic /> : <MicOff />}
        </button>

        <button
          onClick={toggleCamera}
          className={cx('controlBtn', { inactive: !isCameraOn })}
          title={isCameraOn ? 'Tắt Camera' : 'Bật Camera'}
        >
          {isCameraOn ? <Video /> : <VideoOff />}
        </button>

        <button
          onClick={onLeave}
          className={cx('controlBtn', 'leaveBtn')}
          title="Rời cuộc họp"
        >
          <PhoneOff fill="white" />
        </button>
      </div>
    </div>
  );
};

const VideoPlayer = ({
  stream,
  peerId,
}: {
  stream: MediaStream;
  peerId: string;
}) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);

  return (
    <div className={cx('videoContainer')}>
      <video ref={ref} autoPlay playsInline />
      <span className={cx('label')}>User: {peerId.slice(0, 5)}...</span>
    </div>
  );
};

export default VideoRoom;
