import { io } from "socket.io-client";

let socket;

export const connectSocket = (token) => {
  if (socket?.connected) {
    return socket; // Already connected
  }

  socket = io("http://localhost:5000", {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on("connect_error", (error) => {
    console.error("❌ Socket connection error:", error.message);
  });

  socket.on("reconnect_attempt", () => {
    console.log("🔄 Attempting to reconnect...");
  });

  socket.on("reconnect", () => {
    console.log("✅ Reconnected to socket");
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};