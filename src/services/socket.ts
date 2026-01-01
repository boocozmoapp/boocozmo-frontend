// src/services/socket.ts
import { io } from 'socket.io-client';

const SOCKET_URL = "https://boocozmo-api.onrender.com";

export const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  withCredentials: true,
});

// Helper function to join chat room
export const joinChatRoom = (chatId: number) => {
  socket.emit('join_chat', chatId);
};

// Listen for new messages
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const onNewMessage = (callback: (message: any) => void) => {
  socket.on('new_message', callback);
};

// Clean up listener
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const offNewMessage = (callback: (message: any) => void) => {
  socket.off('new_message', callback);
};