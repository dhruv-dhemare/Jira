const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { verifyToken } = require("../middleware/authMiddleware");

// Get current logged-in user
router.get("/me", verifyToken, async (req, res) => {
  const user = await pool.query(
    "SELECT * FROM users WHERE id=$1",
    [req.user.id]
  );

  res.json(user.rows[0]);
});

// Get all users (admin only)
router.get("/", verifyToken, async (req, res) => {
  const users = await pool.query("SELECT * FROM users");
  res.json(users.rows);
});

module.exports = router;