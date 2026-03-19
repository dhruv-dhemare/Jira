const { io } = require("socket.io-client");

const socket = io("http://localhost:5000", {
  auth: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6Im1hbmFnZXIiLCJpYXQiOjE3NzM5MTk2NjQsImV4cCI6MTc3NDAwNjA2NH0.4xnKf9UIdMmWZ0lXRCORBkMFuR9hcZvwa2MM2bUPaJs", // 🔥 REQUIRED
  },
});

socket.on("connect", () => {
  console.log("Connected:", socket.id);
  socket.emit("joinUserRoom");
  socket.emit("joinProject", 4);
});

socket.on("taskCreated", console.log);
socket.on("taskUpdated", console.log);
socket.on("memberAdded", console.log);

socket.on("connect_error", (err) => {
  console.log("❌ Connection error:", err.message);
});