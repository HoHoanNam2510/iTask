/* client/src/components/VideoRoom/VideoRoom.tsx */
import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import { useSocket } from '~/context/SocketContext';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import styles from './VideoRoom.module.scss'; // Sẽ tạo style sau
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

interface VideoRoomProps {
  roomId: string;
  userId: string; // ID của user hiện tại
  onLeave: () => void;
}

const VideoRoom: React.FC<VideoRoomProps> = ({ roomId, userId, onLeave }) => {
  const { socket } = useSocket();
  const [peers, setPeers] = useState<Record<string, any>>({}); // Danh sách kết nối
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]);

  // Controls
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  const myVideoRef = useRef<HTMLVideoElement>(null);
  const peerInstance = useRef<Peer | null>(null);

  useEffect(() => {
    if (!socket) return;

    // 1. Khởi tạo PeerJS
    const peer = new Peer(userId, {
      host: 'localhost', // Đổi thành domain nếu deploy
      port: 5000,
      path: '/peerjs/myapp',
    });
    peerInstance.current = peer;

    // 2. Lấy Stream Camera/Mic
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        setMyStream(stream);
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = stream;
        }

        // 3. Lắng nghe cuộc gọi đến (Answer)
        peer.on('call', (call) => {
          call.answer(stream); // Trả lời và gửi stream của mình
          call.on('stream', (userVideoStream) => {
            addRemoteStream(userVideoStream);
          });
        });

        // 4. Lắng nghe Socket: Có người mới vào -> Gọi cho họ
        socket.on('user-connected', (newUserId: string) => {
          connectToNewUser(newUserId, stream, peer);
        });
      });

    // 5. Join Room qua Socket
    peer.on('open', (id) => {
      socket.emit('join-room', roomId, id);
    });

    // 6. Xử lý khi có người thoát
    socket.on('user-disconnected', (disconnectedUserId: string) => {
      if (peers[disconnectedUserId]) {
        peers[disconnectedUserId].close();
      }
      // Logic xóa stream ở đây hơi phức tạp vì stream ko có userId đi kèm mặc định
      // Tạm thời React sẽ re-render, bản đầy đủ cần map stream với userId
    });

    return () => {
      socket.off('user-connected');
      socket.off('user-disconnected');
      peer.destroy();
      if (myStream) {
        myStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [roomId, userId, socket]);

  // Hàm thêm stream của người khác vào list
  const addRemoteStream = (stream: MediaStream) => {
    setRemoteStreams((prev) => {
      if (prev.some((s) => s.id === stream.id)) return prev;
      return [...prev, stream];
    });
  };

  // Hàm gọi cho người mới
  const connectToNewUser = (
    newUserId: string,
    stream: MediaStream,
    peer: Peer
  ) => {
    const call = peer.call(newUserId, stream);
    call.on('stream', (userVideoStream) => {
      addRemoteStream(userVideoStream);
    });
    call.on('close', () => {
      // Remove stream logic
    });

    setPeers((prev) => ({ ...prev, [newUserId]: call }));
  };

  const toggleMic = () => {
    if (myStream) {
      myStream.getAudioTracks()[0].enabled = !isMicOn;
      setIsMicOn(!isMicOn);
    }
  };

  const toggleCamera = () => {
    if (myStream) {
      myStream.getVideoTracks()[0].enabled = !isCameraOn;
      setIsCameraOn(!isCameraOn);
    }
  };

  return (
    <div className={cx('videoRoomOverlay')}>
      <div className={cx('videoGrid')}>
        {/* Video của chính mình */}
        <div className={cx('videoContainer')}>
          <video ref={myVideoRef} autoPlay muted playsInline />
          <span className={cx('label')}>You</span>
        </div>

        {/* Video của người khác */}
        {remoteStreams.map((stream, index) => (
          <VideoPlayer key={index} stream={stream} />
        ))}
      </div>

      {/* Controls Bar */}
      <div className={cx('controlsBar')}>
        <button
          onClick={toggleMic}
          className={cx('controlBtn', { active: !isMicOn })}
        >
          {isMicOn ? <Mic /> : <MicOff />}
        </button>
        <button
          onClick={toggleCamera}
          className={cx('controlBtn', { active: !isCameraOn })}
        >
          {isCameraOn ? <Video /> : <VideoOff />}
        </button>
        <button onClick={onLeave} className={cx('controlBtn', 'leaveBtn')}>
          <PhoneOff />
        </button>
      </div>
    </div>
  );
};

// Component con để render video remote
const VideoPlayer = ({ stream }: { stream: MediaStream }) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <div className={cx('videoContainer')}>
      <video ref={ref} autoPlay playsInline />
    </div>
  );
};

export default VideoRoom;
