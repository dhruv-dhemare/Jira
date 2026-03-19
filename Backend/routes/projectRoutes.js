const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { verifyToken } = require("../middleware/authMiddleware");

// Create project (manager only)
router.post("/", verifyToken, async (req, res) => {
  if (req.user.role !== "manager") {
    return res.status(403).json({ error: "Only managers can create projects" });
  }

  const { name, description } = req.body;

  const project = await pool.query(
    "INSERT INTO projects (name, description, manager_id) VALUES ($1, $2, $3) RETURNING *",
    [name, description, req.user.id]
  );

  // 🔥 AUTO ADD MANAGER
  await pool.query(
    "INSERT INTO project_members (user_id, project_id, role, assigned_by) VALUES ($1, $2, $3, $4)",
    [req.user.id, project.rows[0].id, "manager", req.user.id]
  );

  res.json(project.rows[0]);
});

// Get all projects of logged-in user
router.get("/", verifyToken, async (req, res) => {
  const projects = await pool.query(
    `SELECT * FROM projects WHERE manager_id=$1`,
    [req.user.id]
  );

  res.json(projects.rows);
});

module.exports = router;