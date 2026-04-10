const { joinProjectRoom } = require("./rooms");
const pool = require("../config/db");

module.exports = (io, socket) => {

  // 🔐 Secure join project
  socket.on("joinProject", async (data, callback) => {
    try {
      const projectId = data?.projectId || data;
      
      console.log(`👥 User ${socket.user.email} attempting to join project: ${projectId}`);
      
      const result = await pool.query(
        "SELECT * FROM project_members WHERE user_id=$1 AND project_id=$2",
        [socket.user.id, projectId]
      );

      if (result.rows.length === 0) {
        const error = "User is not a project member";
        console.error(`❌ ${error} - User: ${socket.user.email}, Project: ${projectId}`);
        if (callback) callback({ error });
        return socket.emit("error", error);
      }

      // ✅ If valid → join room
      joinProjectRoom(socket, projectId);
      
      // Send success callback
      if (callback) callback({ success: true });
      console.log(`✅ User ${socket.user.email} successfully joined project room: project_${projectId}`);

    } catch (err) {
      console.error("❌ Join project error:", err.message);
      if (callback) callback({ error: "Server error" });
      socket.emit("error", "Server error");
    }
  });

  // Leave project room
  socket.on("leaveProject", async (data) => {
    try {
      const projectId = data?.projectId || data;
      socket.leave(`project_${projectId}`);
      console.log(`👋 User ${socket.user.email} left project room: project_${projectId}`);
    } catch (err) {
      console.error("❌ Leave project error:", err);
    }
  });

  socket.on("joinUserRoom", () => {
    const userId = socket.user.id;

    socket.join(`user_${userId}`);

    console.log(`👤 User ${socket.user.email} joined personal notification room: user_${userId}`);
  });

};