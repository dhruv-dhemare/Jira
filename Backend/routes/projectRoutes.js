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

module.exports = router;