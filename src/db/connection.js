// db/connection.js — PostgreSQL connection pool
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // BUG 1: No max connections set — can exhaust DB under load
  // BUG 2: No idleTimeoutMillis — connections never released
  // BUG 3: No connectionTimeoutMillis — queries hang indefinitely on DB unreachable
});

// BUG 4: No pool.on('error') handler — unhandled errors crash the process
module.exports = pool;
