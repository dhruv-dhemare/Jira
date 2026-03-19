const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const registerHandlers = require("../sockets/handlers");

let io;



const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
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
    console.log("🔐 Authenticated user:", socket.user);

    registerHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log("❌ Disconnected:", socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket not initialized");
  return io;
};

module.exports = { initSocket, getIO };