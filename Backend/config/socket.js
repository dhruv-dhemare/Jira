const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const registerHandlers = require("../sockets/handlers");

let io;

const initSocket = (server) => {
  // Get allowed origins from environment or use defaults
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean);
  
  // Add default local development origins
  if (allowedOrigins.length === 0) {
    allowedOrigins.push(
      "http://localhost:5173",  // Vite default
      "http://localhost:3000",  // Alternative dev port
      "http://127.0.0.1:5173"
    );
  }

  console.log("🔒 Socket CORS allowed origins:", allowedOrigins);

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
      allowEIO3: true, // Support Engine.IO 3 clients
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  // 🔐 AUTH MIDDLEWARE
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("No token provided"));
      }

      const decoded = jwt.verify(token, process.env.SECRET_KEY);

      // Attach user to socket
      socket.user = decoded;
      

      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("✅ Socket connected - User:", socket.user?.email, "Socket ID:", socket.id);

    registerHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log("❌ Disconnected - User:", socket.user?.email, "Socket ID:", socket.id);
    });
    
    socket.on("error", (error) => {
      console.error("Socket error for user", socket.user?.email, ":", error);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket not initialized");
  return io;
};

module.exports = { initSocket, getIO };