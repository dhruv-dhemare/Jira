const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { verifyToken } = require("../middleware/authMiddleware");
const { getIO } = require("../config/socket");
const { isProjectMember, allowProjectRoles } = require("../middleware/projectAuth");
const { createNotification } = require("../utils/notifications");

// Create sprint (manager OR master)
router.post(
  "/",
  verifyToken,
  isProjectMember,
  allowProjectRoles("manager", "master"),
  async (req, res) => {
    try {
      const { name, startDate, endDate, projectId } = req.body;

      // Validate required fields
      if (!name || !startDate || !endDate || !projectId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validate date order
      if (new Date(endDate) < new Date(startDate)) {
        return res.status(400).json({ error: "End date must be after start date" });
      }

      // Create sprint
      const sprint = await pool.query(
        `INSERT INTO sprints (name, start_date, end_date, project_id)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [name, startDate, endDate, projectId]
      );

      const io = getIO();
      const creatorUser = await pool.query(
        "SELECT name FROM users WHERE id=$1",
        [req.user.id]
      );
      const creatorName = creatorUser.rows[0]?.name || "Unknown";

      io.to(`project_${projectId}`).emit("sprintCreated", {
        type: `${creatorName} created sprint "${name}"`,
        data: sprint.rows[0],
      });

      res.status(201).json(sprint.rows[0]);
    } catch (error) {
      console.error("Error creating sprint:", error);
      res.status(500).json({ error: "Failed to create sprint" });
    }
  }
);

// Get all sprints for a project (ONLY project members)
router.get(
  "/:projectId",
  verifyToken,
  isProjectMember,
  async (req, res) => {
    try {
      const { projectId } = req.params;

      const sprints = await pool.query(
        "SELECT * FROM sprints WHERE project_id=$1 ORDER BY start_date DESC",
        [projectId]
      );

      res.json(sprints.rows);
    } catch (error) {
      console.error("Error fetching sprints:", error);
      res.status(500).json({ error: "Failed to fetch sprints" });
    }
  }
);

// Get single sprint by ID
router.get(
  "/details/:sprintId",
  verifyToken,
  async (req, res) => {
    try {
      const { sprintId } = req.params;

      const sprint = await pool.query(
        "SELECT * FROM sprints WHERE id=$1",
        [sprintId]
      );

      if (sprint.rows.length === 0) {
        return res.status(404).json({ error: "Sprint not found" });
      }

      // Verify user is a project member
      const projectId = sprint.rows[0].project_id;
      const memberCheck = await pool.query(
        "SELECT * FROM project_members WHERE user_id=$1 AND project_id=$2",
        [req.user.id, projectId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: "Not a project member" });
      }

      res.json(sprint.rows[0]);
    } catch (error) {
      console.error("Error fetching sprint:", error);
      res.status(500).json({ error: "Failed to fetch sprint" });
    }
  }
);

// Update sprint (manager OR master)
router.put(
  "/:sprintId",
  verifyToken,
  async (req, res) => {
    try {
      const { sprintId } = req.params;
      const { name, startDate, endDate } = req.body;

      // Get sprint to verify permissions
      const sprint = await pool.query(
        "SELECT * FROM sprints WHERE id=$1",
        [sprintId]
      );

      if (sprint.rows.length === 0) {
        return res.status(404).json({ error: "Sprint not found" });
      }

      const projectId = sprint.rows[0].project_id;

      // Check project membership and role
      const memberCheck = await pool.query(
        "SELECT role FROM project_members WHERE user_id=$1 AND project_id=$2",
        [req.user.id, projectId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: "Not a project member" });
      }

      if (!["manager", "master"].includes(memberCheck.rows[0].role)) {
        return res.status(403).json({ error: "Permission denied" });
      }

      // Validate date order if both dates are provided
      if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
        return res.status(400).json({ error: "End date must be after start date" });
      }

      // Update sprint
      const updatedSprint = await pool.query(
        `UPDATE sprints 
         SET name=$1, start_date=$2, end_date=$3
         WHERE id=$4 RETURNING *`,
        [name || sprint.rows[0].name, startDate || sprint.rows[0].start_date, endDate || sprint.rows[0].end_date, sprintId]
      );

      const io = getIO();
      const updaterUser = await pool.query(
        "SELECT name FROM users WHERE id=$1",
        [req.user.id]
      );
      const updaterName = updaterUser.rows[0]?.name || "Unknown";

      io.to(`project_${projectId}`).emit("sprintUpdated", {
        type: `${updaterName} updated sprint "${updatedSprint.rows[0].name}"`,
        data: updatedSprint.rows[0],
      });

      res.json(updatedSprint.rows[0]);
    } catch (error) {
      console.error("Error updating sprint:", error);
      res.status(500).json({ error: "Failed to update sprint" });
    }
  }
);

// Delete sprint (manager OR master)
router.delete(
  "/:sprintId",
  verifyToken,
  async (req, res) => {
    try {
      const { sprintId } = req.params;

      // Get sprint to verify permissions
      const sprint = await pool.query(
        "SELECT * FROM sprints WHERE id=$1",
        [sprintId]
      );

      if (sprint.rows.length === 0) {
        return res.status(404).json({ error: "Sprint not found" });
      }

      const projectId = sprint.rows[0].project_id;

      // Check project membership and role
      const memberCheck = await pool.query(
        "SELECT role FROM project_members WHERE user_id=$1 AND project_id=$2",
        [req.user.id, projectId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: "Not a project member" });
      }

      if (!["manager", "master"].includes(memberCheck.rows[0].role)) {
        return res.status(403).json({ error: "Permission denied" });
      }

      // Delete sprint
      await pool.query("DELETE FROM sprints WHERE id=$1", [sprintId]);

      const io = getIO();
      const deleterUser = await pool.query(
        "SELECT name FROM users WHERE id=$1",
        [req.user.id]
      );
      const deleterName = deleterUser.rows[0]?.name || "Unknown";

      io.to(`project_${projectId}`).emit("sprintDeleted", {
        type: `${deleterName} deleted sprint "${sprint.rows[0].name}"`,
        data: { id: sprintId },
      });

      res.json({ message: "Sprint deleted successfully" });
    } catch (error) {
      console.error("Error deleting sprint:", error);
      res.status(500).json({ error: "Failed to delete sprint" });
    }
  }
);

module.exports = router;
