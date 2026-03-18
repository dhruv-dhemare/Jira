const pool = require("./config/db");

async function check() {
  const result = await pool.query("SELECT * FROM users");
  console.log(result.rows);
}

check();