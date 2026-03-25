const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { verifyToken } = require("../middleware/authMiddleware");
const { getIO } = require("../config/socket");
const { isProjectMember, allowProjectRoles } = require("../middleware/projectAuth");
const { createNotification } = require("../utils/notifications");


// Create task (manager OR master)
router.post(
  "/",
  verifyToken,
  isProjectMember,
  allowProjectRoles("manager", "master"),
  async (req, res) => {
    const { title, description, projectId, assignedTo, deadline, sprintId } = req.body;

    const task = await pool.query(
      `INSERT INTO tasks (title, description, project_id, assigned_to, created_by, deadline, sprint_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description, projectId, assignedTo, req.user.id, deadline, sprintId]
    );
    
    const io = getIO();
    
    // Get creator name
    const creatorUser = await pool.query(
      "SELECT name FROM users WHERE id=$1",
      [req.user.id]
    );
    const creatorName = creatorUser.rows[0]?.name || "Unknown";
    
    let assignMessage = "created a task";
    if (assignedTo) {
      const assignedUser = await pool.query(
        "SELECT name FROM users WHERE id=$1",
        [assignedTo]
      );
      if (assignedUser.rows.length > 0) {
        assignMessage += ` and assigned to ${assignedUser.rows[0].name}`;
      }
    }

    await createNotification(
      assignedTo,
      "You have been assigned a new task",
      "TASK_ASSIGNED"
    );
    io.to(`project_${projectId}`).emit("taskCreated", {
      type: creatorName + " " + assignMessage,
      data: task.rows[0],
    });

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
  const { status, title, description, deadline, sprintId, assignedTo } = req.body;

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
    `UPDATE tasks SET 
      status=$1, 
      title=COALESCE($2, title), 
      description=COALESCE($3, description), 
      deadline=COALESCE($4, deadline), 
      sprint_id=COALESCE($5, sprint_id),
      assigned_to=COALESCE($6, assigned_to)
     WHERE id=$7 RETURNING *`,
    [status, title, description, deadline, sprintId, assignedTo, taskId]
  );
  
  await createNotification(
    taskData.assigned_to,
    "Your task status was updated",
    "TASK_UPDATED"
  );

  const io = getIO();
  io.to(`project_${taskData.project_id}`).emit("taskUpdated", updated.rows[0]);

  res.json(updated.rows[0]);
});
module.exports = router;