const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { verifyToken } = require("../middleware/authMiddleware");
const { getIO } = require("../config/socket");
const { isProjectMember, allowProjectRoles } = require("../middleware/projectAuth");
const { createNotification } = require("../utils/notifications");


// Create task (manager or master only)
router.post(
  "/",
  verifyToken,
  isProjectMember,
  async (req, res) => {
    const { title, description, projectId, assignedTo, deadline, sprintId } = req.body;

    // 🔒 Only manager or master can create tasks
    if (!["manager", "master"].includes(req.user.role)) {
      return res.status(403).json({ error: "Only managers or masters can create tasks" });
    }

    const task = await pool.query(
      `INSERT INTO tasks (title, description, project_id, assigned_to, created_by, deadline, sprint_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, description, projectId, assignedTo, req.user.id, deadline, sprintId, 'Todo']
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

// Update task (manager or master only, with limited status updates for workers)
router.put("/:taskId", verifyToken, async (req, res) => {
  const { taskId } = req.params;
  const { status = 'Todo', title, description, deadline, sprintId, assigned_to } = req.body;

  const task = await pool.query(
    "SELECT * FROM tasks WHERE id=$1",
    [taskId]
  );

  if (task.rows.length === 0) {
    return res.status(404).json({ error: "Task not found" });
  }

  const taskData = task.rows[0];

  // 🔒 Authorization logic
  if (req.user.role === "worker") {
    // Workers can ONLY update status between "Todo" and "In Review"
    // AND cannot update any other fields
    const isOnlyStatusUpdate = !title && !description && !deadline && !sprintId && assigned_to === undefined;
    const isValidWorkerTransition = 
      isOnlyStatusUpdate && 
      ((status === "In Review" && taskData.status === "Todo") ||
       (status === "Todo" && taskData.status === "In Review"));

    if (!isValidWorkerTransition) {
      return res.status(403).json({ error: "Workers can only move tasks between TODO and IN REVIEW" });
    }
  } else if (!["manager", "master"].includes(req.user.role)) {
    // For non-workers who aren't manager/master, deny access
    return res.status(403).json({ error: "You don't have permission to update tasks" });
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
    [status, title, description, deadline, sprintId, assigned_to, taskId]
  );
  
  await createNotification(
    taskData.assigned_to,
    "Your task status was updated",
    "TASK_UPDATED"
  );

  const io = getIO();
  console.log(`📡 Broadcasting taskUpdated to project_${taskData.project_id} - Task ID:`, updated.rows[0].id);
  io.to(`project_${taskData.project_id}`).emit("taskUpdated", updated.rows[0]);

  res.json(updated.rows[0]);
});

// Delete task (manager OR master)
router.delete("/:taskId", verifyToken, async (req, res) => {
  const { taskId } = req.params;

  try {
    const task = await pool.query(
      "SELECT * FROM tasks WHERE id=$1",
      [taskId]
    );

    if (task.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    const taskData = task.rows[0];

    // Check authorization - only manager/master can delete
    if (!["manager", "master"].includes(req.user.role)) {
      return res.status(403).json({ error: "Not allowed to delete this task" });
    }

    // Delete the task
    await pool.query("DELETE FROM tasks WHERE id=$1", [taskId]);

    const io = getIO();
    io.to(`project_${taskData.project_id}`).emit("taskDeleted", { taskId });

    res.json({ message: "Task deleted successfully", taskId });
  } catch (err) {
    console.error("Error deleting task:", err);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

module.exports = router;