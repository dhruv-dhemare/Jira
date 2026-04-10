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

  try {
    // Find user by email
    const user = await pool.query(
      "SELECT id FROM users WHERE email=$1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = user.rows[0].id;

    console.log(`🔍 Current user role before update:`, user.rows[0]);

    // Check if requester is manager
    const project = await pool.query(
      "SELECT * FROM projects WHERE id=$1 AND manager_id=$2",
      [projectId, req.user.id]
    );

    if (project.rows.length === 0) {
      return res.status(403).json({ error: "Only manager can assign master" });
    }

    // Check current user info before update
    const userBefore = await pool.query(
      "SELECT id, email, role FROM users WHERE id=$1",
      [userId]
    );
    console.log(`📋 User info BEFORE update:`, userBefore.rows[0]);

    // Insert user as master in project_members
    const insertResult = await pool.query(
      "INSERT INTO project_members (user_id, project_id, role, assigned_by) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, project_id) DO UPDATE SET role=$3 RETURNING *",
      [userId, projectId, "master", req.user.id]
    );
    console.log(`✅ Inserted/Updated project_members:`, insertResult.rows[0]);

    console.log(`🔄 Attempting to update user ${userId} to master role...`);
    console.log(`📊 Update query: UPDATE users SET role=$1 WHERE id=$2 with values: ["master", ${userId}]`);

    // Update user's global role in users table to master
    const updateResult = await pool.query(
      "UPDATE users SET role=$1 WHERE id=$2 RETURNING id, email, role",
      ["master", userId]
    );

    console.log(`📊 Update result:`, updateResult);
    console.log(`📊 Rows affected:`, updateResult.rowCount);
    console.log(`📊 Returned rows:`, updateResult.rows);

    // Verify the update
    const userAfter = await pool.query(
      "SELECT id, email, role FROM users WHERE id=$1",
      [userId]
    );
    console.log(`📋 User info AFTER update:`, userAfter.rows[0]);

    if (updateResult.rowCount === 0) {
      console.error(`❌ Failed to update user ${userId} to master role - no rows affected`);
      return res.status(500).json({ error: "Failed to update user role" });
    }

    if (updateResult.rows.length === 0) {
      console.error(`❌ Failed to update user ${userId} to master role - no rows returned`);
      return res.status(500).json({ error: "Failed to update user role" });
    }

    console.log(`✅ User ${email} promoted to master. New role:`, updateResult.rows[0].role);

    // Notify the user
    await createNotification(
      userId,
      "You have been promoted to Master",
      "MASTER_ASSIGNED"
    );

    // Broadcast the change to project room
    const io = getIO();
    io.to(`project_${projectId}`).emit("memberRoleChanged", { userId, role: "master" });
    
    // Broadcast to user's personal room so they're notified of role change
    io.to(`user_${userId}`).emit("userRoleChanged", { 
      userId, 
      oldRole: "worker", 
      newRole: "master",
      message: "Your role has been updated to Master"
    });
    console.log(`📡 Broadcasting userRoleChanged to user_${userId}`);

    res.json({ 
      message: "Master assigned successfully",
      user: updateResult.rows[0]
    });
  } catch (err) {
    console.error("Error assigning master:", err);
    res.status(500).json({ error: "Failed to assign master" });
  }
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