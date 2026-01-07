/* client/src/context/SocketContext.tsx */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // 👇 [FIXED] Quay lại cấu hình polling mặc định để đảm bảo kết nối
    const newSocket = io('http://localhost:5000', {
      transports: ['polling', 'websocket'], // Polling trước, upgrade sau
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ Socket Connected:', newSocket.id);
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Socket Connection Error:', err.message);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('⚠️ Socket Disconnected:', reason);
    });

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
