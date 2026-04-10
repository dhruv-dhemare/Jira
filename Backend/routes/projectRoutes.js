const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { verifyToken } = require("../middleware/authMiddleware");
const { getIO } = require("../config/socket");

// Create project (manager only)
router.post("/", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only managers can create projects" });
    }

    const { name, description, start_date, end_date } = req.body;

    // 🔒 Basic validation
    if (!name) {
      return res.status(400).json({ error: "Project name is required" });
    }

    const project = await pool.query(
      `INSERT INTO projects 
       (name, description, manager_id, owner_id, start_date, end_date) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        name,
        description || null,
        req.user.id, // manager_id
        req.user.id, // owner_id 
        start_date || null,
        end_date || null,
      ]
    );

    const projectId = project.rows[0].id;

    // 🔥 AUTO ADD MANAGER TO MEMBERS
    await pool.query(
      `INSERT INTO project_members 
       (user_id, project_id, role, assigned_by) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, project_id) DO NOTHING`,
      [req.user.id, projectId, "manager", req.user.id]
    );

    // 📡 Broadcast to all connected users
    const io = getIO();
    io.to(`user_${req.user.id}`).emit("projectCreated", project.rows[0]);
    console.log(`📡 Broadcasting projectCreated to user ${req.user.id}`);

    res.status(201).json(project.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create project" });
  }
});


// Get all projects of logged-in user
router.get("/", verifyToken, async (req, res) => {
  try {
    const projects = await pool.query(
      `
      SELECT DISTINCT p.*
      FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = $1
      ORDER BY p.created_at DESC
      `,
      [req.user.id]
    );
    res.json(projects.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

//a project details
// Get single project details (name + members count)
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 🔒 Check access
    const accessCheck = await pool.query(
      `SELECT 1 FROM project_members 
       WHERE user_id = $1 AND project_id = $2`,
      [req.user.id, id]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: "Access denied" });
    }

    // ✅ Get project + member count
    const result = await pool.query(
      `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.created_at,
        COUNT(pm.user_id) AS member_count
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE p.id = $1
      GROUP BY p.id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch project details" });
  }
});


//get project memebers
router.get("/:projectId/members", verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    // 🔒 Check access
    const accessCheck = await pool.query(
      `SELECT 1 FROM project_members 
       WHERE user_id = $1 AND project_id = $2`,
      [req.user.id, projectId]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: "Access denied" });
    }

    // ✅ Fetch members
    const members = await pool.query(
      `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.avatar,   -- 👈 important
        pm.role
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1
      ORDER BY pm.created_at ASC
      `,
      [projectId]
    );

    res.json(members.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch members" });
  }
});


//add member to project (manager only)
router.post("/:id/add-member", verifyToken, async (req, res) => {
  try {
    const projectId = req.params.id;
    const { email, role } = req.body;

    console.log(`🔍 Add member request: email=${email}, role=${role}, projectId=${projectId}`);

    // Safety check
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check role - only manager can add members
    if (req.user.role !== "manager") {
      return res.status(403).json({ message: "Only managers can add members" });
    }

    // Find user
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];
    console.log(`📋 Found user:`, user.id, user.email, "Current role:", user.role);

    // Add to project
    const insertResult = await pool.query(
      `INSERT INTO project_members (project_id, user_id, role, assigned_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (project_id, user_id) DO UPDATE SET role=$3
       RETURNING *`,
      [projectId, user.id, role, req.user.id]
    );
    console.log(`✅ Added/Updated project_members:`, insertResult.rows[0]);

    // If role is "master", update global user role to master
    let globalRoleUpdated = false;
    if (role === "master") {
      console.log(`🔄 Role is master, updating global user role...`);
      const updateResult = await pool.query(
        "UPDATE users SET role=$1 WHERE id=$2 RETURNING id, email, role",
        ["master", user.id]
      );
      console.log(`✅ Updated user global role to master:`, updateResult.rows[0]);
      globalRoleUpdated = true;
    }

    // Broadcast updates
    const io = require("../config/socket").getIO();
    if (globalRoleUpdated) {
      io.to(`user_${user.id}`).emit("userRoleChanged", {
        userId: user.id,
        oldRole: user.role,
        newRole: "master",
        message: "Your role has been updated to Master"
      });
      console.log(`📡 Broadcasted userRoleChanged`);
    }

    res.json({ 
      message: "Member added successfully", 
      user: { ...user, role },
      globalRoleUpdated
    });

  } catch (err) {
    console.error("❌ ADD MEMBER ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// Delete member from project (master or manager only, can only delete workers)
router.delete("/:projectId/members/:userId", verifyToken, async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    // 🔒 Authorization check - only master or manager can delete members
    if (!["manager", "master"].includes(req.user.role)) {
      return res.status(403).json({ error: "Only managers or masters can remove members" });
    }

    // 🔒 Verify access - user making request must be part of the project
    const accessCheck = await pool.query(
      `SELECT 1 FROM project_members 
       WHERE user_id = $1 AND project_id = $2`,
      [req.user.id, projectId]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check if member exists in project and get their role
    const memberCheck = await pool.query(
      `SELECT role FROM project_members 
       WHERE user_id = $1 AND project_id = $2`,
      [userId, projectId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(404).json({ error: "Member not found in this project" });
    }

    // 🔒 Only allow deletion of workers
    const memberRole = memberCheck.rows[0].role;
    if (memberRole !== "worker") {
      return res.status(403).json({ error: "Only workers can be removed from the project" });
    }

    // Delete the member from project
    await pool.query(
      `DELETE FROM project_members 
       WHERE user_id = $1 AND project_id = $2`,
      [userId, projectId]
    );

    res.json({ message: "Member removed successfully", userId, projectId });

  } catch (err) {
    console.error("DELETE MEMBER ERROR:", err);
    res.status(500).json({ error: "Failed to remove member", details: err.message });
  }
});

// Delete project (master or manager only)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const projectId = req.params.id;

    // 🔒 Authorization check - only master or manager can delete
    if (!["manager", "master"].includes(req.user.role)) {
      return res.status(403).json({ error: "Only managers or masters can delete projects" });
    }

    // 🔒 Verify access - user must be part of the project
    const accessCheck = await pool.query(
      `SELECT 1 FROM project_members 
       WHERE user_id = $1 AND project_id = $2`,
      [req.user.id, projectId]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: "Access denied" });
    }

    // ✅ Delete related data in correct order (foreign key constraints)
    
    // First, get all task IDs in this project
    const tasksResult = await pool.query(
      "SELECT id FROM tasks WHERE project_id = $1",
      [projectId]
    );
    
    const taskIds = tasksResult.rows.map(row => row.id);

    // Delete notifications for tasks in this project (if task IDs exist)
    if (taskIds.length > 0) {
      await pool.query(
        `DELETE FROM notifications 
         WHERE task_id = ANY($1)`,
        [taskIds]
      );
    }

    // Delete tasks in this project
    await pool.query(
      "DELETE FROM tasks WHERE project_id = $1",
      [projectId]
    );

    // Delete sprints in this project
    await pool.query(
      "DELETE FROM sprints WHERE project_id = $1",
      [projectId]
    );

    // Delete project members
    await pool.query(
      "DELETE FROM project_members WHERE project_id = $1",
      [projectId]
    );

    // Delete the project itself
    await pool.query(
      "DELETE FROM projects WHERE id = $1",
      [projectId]
    );

    res.json({ message: "Project deleted successfully", projectId });

  } catch (err) {
    console.error("DELETE PROJECT ERROR:", err);
    res.status(500).json({ error: "Failed to delete project", details: err.message });
  }
});

module.exports = router;