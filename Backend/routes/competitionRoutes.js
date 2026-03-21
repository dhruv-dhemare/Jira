const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { verifyToken } = require("../middleware/authMiddleware");


// ➕ Create competition (manager only)
router.post("/", verifyToken, async (req, res) => {
  try {
    // 🔒 Only manager allowed
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only managers can create competitions" });
    }

    const { name, description, start_date, end_date } = req.body;

    // 🔒 Validation
    if (!name || !start_date || !end_date) {
      return res.status(400).json({ error: "Name, start_date and end_date are required" });
    }

    const result = await pool.query(
      `INSERT INTO competition (name, description, start_date, end_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description || null, start_date, end_date]
    );

    res.status(201).json({
      message: "Competition created",
      competition: result.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create competition" });
  }
});


// 📥 Get all competitions (everyone logged-in)
router.get("/", verifyToken, async (req, res) => {
  try {
    const competitions = await pool.query(`
      SELECT *,
        CASE
          WHEN CURRENT_DATE < start_date THEN 'upcoming'
          WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN 'ongoing'
          WHEN CURRENT_DATE > end_date THEN 'complete'
        END AS status
      FROM competition
      ORDER BY start_date;
    `);

    res.json(competitions.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch competitions" });
  }
});

module.exports = router;