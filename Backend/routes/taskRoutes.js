const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { verifyToken } = require("../middleware/authMiddleware");

const { isProjectMember, allowProjectRoles } = require("../middleware/projectAuth");

// Create task (manager OR master)
router.post(
  "/",
  verifyToken,
  isProjectMember,
  allowProjectRoles("manager", "master"),
  async (req, res) => {
    const { title, description, projectId, assignedTo } = req.body;

    const task = await pool.query(
      `INSERT INTO tasks (title, description, project_id, assigned_to, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, description, projectId, assignedTo, req.user.id]
    );

    res.json(task.rows[0]);
  }
);

// Get tasks (ONLY project members)
router.get(
  "/:projectId",
  verifyToken,
  isProjectMember,
  async (req, res) => {
    const { projectId } = req.params;

    const tasks = await pool.query(
      "SELECT * FROM tasks WHERE project_id=$1",
      [projectId]
    );

    res.json(tasks.rows);
  }
);

// Update task (assigned user OR master/manager)
router.put("/:taskId", verifyToken, async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;

  const task = await pool.query(
    "SELECT * FROM tasks WHERE id=$1",
    [taskId]
  );

  const taskData = task.rows[0];

  if (
    taskData.assigned_to !== req.user.id &&
    !["manager", "master"].includes(req.user.role)
  ) {
    return res.status(403).json({ error: "Not allowed to update this task" });
  }

  const updated = await pool.query(
    "UPDATE tasks SET status=$1 WHERE id=$2 RETURNING *",
    [status, taskId]
  );

  res.json(updated.rows[0]);
});
module.exports = router;