const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "myapp",
  password: "D@11230526",
  port: 5432,
});

module.exports = pool;