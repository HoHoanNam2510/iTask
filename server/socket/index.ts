/* server/socket/index.ts */
import { Server, Socket } from 'socket.io';

export const socketHandler = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Sự kiện khi người dùng tham gia phòng họp (Meeting)
    socket.on('join-room', (roomId: string, userId: string) => {
      console.log(`📞 User ${userId} joined room ${roomId}`);

      socket.join(roomId);

      // Thông báo cho các người dùng khác trong phòng là có người mới vào (để họ gọi cho người mới)
      socket.to(roomId).emit('user-connected', userId);

      // Xử lý khi ngắt kết nối
      socket.on('disconnect', () => {
        console.log(`❌ User ${userId} disconnected from room ${roomId}`);
        socket.to(roomId).emit('user-disconnected', userId);
      });
    });
  });
};
