// src/lib/socket.ts
import { io, Socket } from "socket.io-client";

const API_BASE = "http://192.168.43.224:3000";

let socket: Socket | null = null;

export const getSocket = (userEmail: string): Socket => {
  if (!socket || !socket.connected) {
    socket = io(API_BASE, {
      auth: { userEmail },
      autoConnect: true,
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

// ADD THIS LINE
export { socket };