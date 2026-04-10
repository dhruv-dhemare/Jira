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
    const { quantity = 1 } = req.body;

    // Validate quantity
    if (quantity <= 0 || quantity > 10000) {
      return res.status(400).json({ error: "Quantity must be between 1 and 10000" });
    }

    console.log(`📊 INCREMENT: Item ${id}, Quantity ${quantity}, User ${req.user.id}`);

    // Update inventory
    const result = await pool.query(
      `UPDATE inventory
       SET available = available + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [quantity, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    // 📝 Log to inventory_logs
    await pool.query(
      `INSERT INTO inventory_logs (inventory_id, user_id, action, quantity)
       VALUES ($1, $2, $3, $4)`,
      [id, req.user.id, "INCREMENT", quantity]
    );
    console.log(`✅ Logged INCREMENT to inventory_logs`);

    // 📡 Broadcast inventory update to all users
    const io = getIO();
    console.log("📡 Broadcasting inventoryItemUpdated (increment):", result.rows[0]);
    io.emit("inventoryItemUpdated", result.rows[0]);

    res.json({
      message: `Incremented by ${quantity}`,
      product: result.rows[0],
    });

  } catch (err) {
    console.error("❌ Increment error:", err);
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
    const { quantity = 1, reason = null } = req.body;

    // Validate quantity
    if (quantity <= 0 || quantity > 10000) {
      return res.status(400).json({ error: "Quantity must be between 1 and 10000" });
    }

    console.log(`📊 DECREMENT: Item ${id}, Quantity ${quantity}, Reason: ${reason}, User ${req.user.id}`);

    // ❌ Prevent going below 0
    const result = await pool.query(
      `UPDATE inventory
       SET available = GREATEST(available - $1, 0),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [quantity, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    // 📝 Log to inventory_logs with reason
    await pool.query(
      `INSERT INTO inventory_logs (inventory_id, user_id, action, quantity, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, req.user.id, "DECREMENT", quantity, reason]
    );
    console.log(`✅ Logged DECREMENT to inventory_logs with reason: "${reason}"`);

    // 📡 Broadcast inventory update to all users
    const io = getIO();
    console.log("📡 Broadcasting inventoryItemUpdated (decrement):", result.rows[0]);
    io.emit("inventoryItemUpdated", result.rows[0]);

    res.json({
      message: `Decremented by ${quantity}${reason ? ` (Reason: ${reason})` : ""}`,
      product: result.rows[0],
    });

  } catch (err) {
    console.error("❌ Decrement error:", err);
    res.status(500).json({ error: "Failed to decrement" });
  }
});

// 📜 GET inventory history for an item
router.get("/:id/history", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        il.id,
        il.user_id,
        il.action,
        il.quantity,
        il.reason,
        il.created_at,
        u.name,
        u.email
       FROM inventory_logs il
       JOIN users u ON il.user_id = u.id
       WHERE il.inventory_id = $1
       ORDER BY il.created_at DESC
       LIMIT 100`,
      [id]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("❌ History fetch error:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

module.exports = router;