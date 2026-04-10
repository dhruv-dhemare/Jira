const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { verifyToken } = require("../middleware/authMiddleware");
const { getIO } = require("../config/socket");

// ✅ GET all inventory items
router.get("/", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        category,
        available,
        min_limit,
        updated_at,
        CASE 
          WHEN available < min_limit THEN 'LOW'
          ELSE 'OK'
        END AS status
      FROM inventory
      ORDER BY updated_at DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});


// ✅ CREATE PRODUCT (Only Manager)
router.post("/", verifyToken, async (req, res) => {
  try {
    // 🔒 Role check
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager can create products" });
    }

    const { name, category, available, min_limit } = req.body;

    // 🔒 Basic validation
    if (!name || !category) {
      return res.status(400).json({ error: "Name and category are required" });
    }

    const result = await pool.query(
      `INSERT INTO inventory (name, category, available, min_limit)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        name,
        category,
        available || 0,
        min_limit || 0
      ]
    );

    // 📡 Broadcast inventory update to all users
    const io = getIO();
    console.log("📡 About to broadcast inventoryItemCreated with data:", result.rows[0]);
    io.emit("inventoryItemCreated", result.rows[0]);
    console.log("✅ Broadcasting inventoryItemCreated completed");

    res.status(201).json({
      message: "Product created successfully",
      product: result.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create product" });
  }
});


// router.patch("/:id/min-limit", verifyToken, async (req, res) => {
//   try {
//     // 🔒 Role check
//     if (!["manager", "master"].includes(req.user.role)) {
//       return res.status(403).json({ error: "Not allowed" });
//     }

//     const { id } = req.params;
//     const { min_limit } = req.body;

//     if (min_limit === undefined) {
//       return res.status(400).json({ error: "min_limit is required" });
//     }

//     const result = await pool.query(
//       `UPDATE inventory
//        SET min_limit = $1,
//            updated_at = CURRENT_TIMESTAMP
//        WHERE id = $2
//        RETURNING *`,
//       [min_limit, id]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: "Product not found" });
//     }

//     res.json({
//       message: "Min limit updated",
//       product: result.rows[0],
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to update min limit" });
//   }
// });
router.patch("/:id/increment", verifyToken, async (req, res) => {
  try {
    // 🔒 Role check
    if (!["manager", "master"].includes(req.user.role)) {
      return res.status(403).json({ error: "Not allowed" });
    }

    const { id } = req.params;

    const result = await pool.query(
      `UPDATE inventory
       SET available = available + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({
      message: "Incremented",
      product: result.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to increment" });
  }
});

router.patch("/:id/decrement", verifyToken, async (req, res) => {
  try {
    // 🔒 Role check
    if (!["manager", "master"].includes(req.user.role)) {
      return res.status(403).json({ error: "Not allowed" });
    }

    const { id } = req.params;

    // ❌ Prevent going below 0
    const result = await pool.query(
      `UPDATE inventory
       SET available = GREATEST(available - 1, 0),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({
      message: "Decremented",
      product: result.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to decrement" });
  }
});

module.exports = router;