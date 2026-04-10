import { io } from "socket.io-client";

let socket;

// Get backend URL from environment or use default
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export const connectSocket = (token) => {
  if (socket?.connected) {
    return socket; // Already connected
  }

  console.log("🔌 Connecting to socket at:", BACKEND_URL);

  socket = io(BACKEND_URL, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ["websocket", "polling"], // Try websocket first, fallback to polling
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