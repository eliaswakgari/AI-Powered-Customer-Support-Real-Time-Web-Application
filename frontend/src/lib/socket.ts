import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (token: string) => {
         if (!socket) {
                  socket = io('http://localhost:5000', {
                           auth: { token },
                           withCredentials: true,
                  });
         }
         return socket;
};

export const disconnectSocket = () => {
         if (socket) {
                  socket.disconnect();
                  socket = null;
         }
};
