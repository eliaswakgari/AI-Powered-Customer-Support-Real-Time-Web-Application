import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AuthUser } from '../middleware/auth';

let io: SocketIOServer | null = null;

export const initSocket = (serverIO: SocketIOServer) => {
         io = serverIO;

         io.use((socket, next) => {
                  try {
                           const token = socket.handshake.auth?.token as string | undefined;
                           if (!token) {
                                    return next(new Error('Not authenticated'));
                           }
                           const secret = process.env.JWT_SECRET || 'change-me';
                           const decoded = jwt.verify(token, secret) as AuthUser;
                           (socket as any).user = decoded;
                           return next();
                  } catch (err) {
                           return next(new Error('Invalid token'));
                  }
         });

         io.on('connection', (socket: Socket) => {
                  const user = (socket as any).user as AuthUser | undefined;
                  console.log('Socket connected', socket.id, user);

                  socket.on('join-chat', (chatId: string) => {
                           socket.join(`chat:${chatId}`);
                  });

                  socket.on('leave-chat', (chatId: string) => {
                           socket.leave(`chat:${chatId}`);
                  });

                  socket.on('typing', (chatId: string) => {
                           socket.to(`chat:${chatId}`).emit('typing', { chatId, userId: user?.id });
                  });

                  socket.on('disconnect', () => {
                           console.log('Socket disconnected', socket.id);
                  });
         });
};

export const emitNewMessage = (chatId: string, payload: any) => {
         if (!io) return;
         io.to(`chat:${chatId}`).emit('new-message', payload);
};
