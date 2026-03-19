const { joinProjectRoom } = require("./rooms");
const pool = require("../config/db");

module.exports = (io, socket) => {

  // 🔐 Secure join project
  socket.on("joinProject", async (projectId) => {
    try {
      const result = await pool.query(
        "SELECT * FROM project_members WHERE user_id=$1 AND project_id=$2",
        [socket.user.id, projectId]
      );

      if (result.rows.length === 0) {
        return socket.emit("error", "Not a project member");
      }

      // ✅ If valid → join room
      joinProjectRoom(socket, projectId);

    } catch (err) {
      console.error("Join project error:", err);
      socket.emit("error", "Server error");
    }
  });

  socket.on("joinUserRoom", () => {
    const userId = socket.user.id;

    socket.join(`user_${userId}`);

    console.log(`👤 User ${userId} joined personal room`);
  });

};