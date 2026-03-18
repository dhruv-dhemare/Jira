const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { verifyToken } = require("../middleware/authMiddleware");
const { isProjectMember, allowProjectRoles } = require("../middleware/projectAuth");

// Assign project master
router.post(
  "/assign-master",
  verifyToken,
  async (req, res) => {
    const { userId, projectId } = req.body;

    // Check if user is manager of project
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
  }
);

// Assign worker (manager OR master)
router.post(
  "/assign-worker",
  verifyToken,
  isProjectMember,
  allowProjectRoles("manager", "master"),
  async (req, res) => {
    const { userId, projectId } = req.body;

    await pool.query(
      "INSERT INTO project_members (user_id, project_id, role, assigned_by) VALUES ($1, $2, $3, $4)",
      [userId, projectId, "worker", req.user.id]
    );

    res.json({ message: "Worker assigned" });
  }
);

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