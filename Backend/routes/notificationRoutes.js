const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { verifyToken } = require("../middleware/authMiddleware");

// Get all notifications
router.get("/", verifyToken, async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC",
    [req.user.id]
  );

  res.json(result.rows);
});

// Mark as read
router.put("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  await pool.query(
    "UPDATE notifications SET is_read=true WHERE id=$1",
    [id]
  );

  res.json({ message: "Marked as read" });
});

module.exports = router;