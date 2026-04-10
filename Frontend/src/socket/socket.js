import { io } from "socket.io-client";

let socket;

// Get backend URL from environment or use default
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export const connectSocket = (token) => {
  if (socket?.connected) {
    console.log("✅ Socket already connected at:", BACKEND_URL);
    return socket;
  }

  console.log("🔌 Connecting to socket at:", BACKEND_URL);
  console.log("📱 User Agent:", navigator.userAgent);

  socket = io(BACKEND_URL, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    
    // Brave/Edge compatibility: support both connection types
    transports: ["websocket", "polling"],
    
    // Additional options for stricter browsers
    closeOnBeforeUnload: false,
    withCredentials: true,  // Allow cookies
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected! ID:", socket.id);
  });

  socket.on("connect_error", (error) => {
    console.error("❌ Socket connection error:", {
      message: error.message,
      type: error.type,
      data: error.data,
    });
  });

  socket.on("disconnect", (reason) => {
    console.warn("⚠️ Socket disconnected. Reason:", reason);
  });

  socket.on("reconnect_attempt", () => {
    console.log("🔄 Socket reconnect attempt...");
  });

  socket.on("reconnect", () => {
    console.log("✅ Socket reconnected successfully!");
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