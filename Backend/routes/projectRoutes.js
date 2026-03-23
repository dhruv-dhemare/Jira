const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { verifyToken } = require("../middleware/authMiddleware");

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
    const { email,role } = req.body;


    // Safety check
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check role
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

    // Add to project
    await pool.query(
      `INSERT INTO project_members (project_id, user_id, role, assigned_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [projectId, user.id, role, req.user.id]
    );

    res.json({ message: "Member added successfully", user });

  } catch (err) {
    console.error("ADD MEMBER ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;