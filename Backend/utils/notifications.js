const pool = require("../config/db");
const { getIO } = require("../config/socket");

const createNotification = async (userId, message, type) => {
  try {
    // Save in DB
    const result = await pool.query(
      "INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3) RETURNING *",
      [userId, message, type]
    );

    const notification = result.rows[0];

    // Emit via socket
    const io = getIO();
    io.to(`user_${userId}`).emit("notification", notification);

    return notification;
  } catch (err) {
    console.error("Notification error:", err);
  }
};

module.exports = { createNotification };