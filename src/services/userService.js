// services/userService.js — Business logic for user operations
const db = require('../db/connection');

async function getUser(id) {
  const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
  // BUG 1: Returns undefined silently if user not found — callers get no signal
}

async function deleteUser(id) {
  await db.query('DELETE FROM users WHERE id = $1', [id]);
  // BUG 2: No check if user existed before deleting — silent no-op on bad ID
}

async function createUser(data) {
  // BUG 3: No input sanitization or schema validation before DB insert
  // BUG 4: Password stored in plaintext — should hash with bcrypt before insert
  const result = await db.query(
    'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *',
    [data.email, data.password]
  );
  return result.rows[0];
}

async function listUsers() {
  const result = await db.query('SELECT * FROM users');
  // BUG 5: Returns ALL columns including password hashes — should SELECT specific fields
  return result.rows;
}

module.exports = { getUser, deleteUser, createUser, listUsers };
