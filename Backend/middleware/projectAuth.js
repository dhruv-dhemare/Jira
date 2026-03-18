const pool = require("../config/db");

// Check if user is part of project
exports.isProjectMember = async (req, res, next) => {
  const userId = req.user.id;
  const projectId = req.params.projectId || req.body.projectId;

  const result = await pool.query(
    "SELECT * FROM project_members WHERE user_id=$1 AND project_id=$2",
    [userId, projectId]
  );

  if (result.rows.length === 0) {
    return res.status(403).json({ error: "Not a project member" });
  }

  req.projectRole = result.rows[0].role;
  next();
};

// Allow specific roles inside project
exports.allowProjectRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.projectRole)) {
      return res.status(403).json({ error: "Permission denied" });
    }
    next();
  };
};