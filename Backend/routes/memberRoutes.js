const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { verifyToken } = require("../middleware/authMiddleware");
const { isProjectMember, allowProjectRoles } = require("../middleware/projectAuth");
const { getIO } = require("../config/socket");
const { createNotification } = require("../utils/notifications");
// Assign project master
router.post("/assign-master", verifyToken, async (req, res) => {
  const { email, projectId } = req.body;

  // Find user by email
  const user = await pool.query(
    "SELECT id FROM users WHERE email=$1",
    [email]
  );

  if (user.rows.length === 0) {
    return res.status(404).json({ error: "User not found" });
  }

  const userId = user.rows[0].id;

  // Check if requester is manager
  const project = await pool.query(
    "SELECT * FROM projects WHERE id=$1 AND manager_id=$2",
    [projectId, req.user.id]
  );

  if (project.rows.length === 0) {
    return res.status(403).json({ error: "Only manager can assign master" });
  }

  await pool.query(
    "INSERT INTO project_members (user_id, project_id, role, assigned_by) VALUES ($1, $2, $3, $4)",
    [userId, projectId, "master", req.user.id]
  );

  res.json({ message: "Master assigned" });
});
// Assign worker (manager OR master)
router.post("/assign-worker", verifyToken, async (req, res) => {
  const { email, projectId } = req.body;

  // Find user
  const user = await pool.query(
    "SELECT id FROM users WHERE email=$1",
    [email]
  );

  if (user.rows.length === 0) {
    return res.status(404).json({ error: "User not found" });
  }

  const userId = user.rows[0].id;

  // Check role in project
  const membership = await pool.query(
    "SELECT role FROM project_members WHERE user_id=$1 AND project_id=$2",
    [req.user.id, projectId]
  );

  if (
    membership.rows.length === 0 ||
    !["manager", "master"].includes(membership.rows[0].role)
  ) {
    return res.status(403).json({ error: "Not allowed" });
  }

  await pool.query(
    "INSERT INTO project_members (user_id, project_id, role, assigned_by) VALUES ($1, $2, $3, $4)",
    [userId, projectId, "worker", req.user.id]
  );
  await createNotification(
    userId,
    "You have been added to a project",
    "PROJECT_ADDED"
  );
  const io = getIO();
  io.to(`project_${projectId}`).emit("memberAdded", { userId, role: "worker", });
  res.json({ message: "Worker assigned" });
});

// Get all members of a project
router.get("/:projectId", verifyToken, async (req, res) => {
  const { projectId } = req.params;

  const members = await pool.query(
    `SELECT u.id, u.name, u.email, pm.role
     FROM project_members pm
     JOIN users u ON pm.user_id = u.id
     WHERE pm.project_id=$1`,
    [projectId]
  );

  res.json(members.rows);
});

module.exports = router;