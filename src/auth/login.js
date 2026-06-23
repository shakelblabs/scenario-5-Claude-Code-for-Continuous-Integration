// auth/login.js — Handles user login
const db = require('../db/connection');
const jwt = require('jsonwebtoken');

async function loginUser(req, res) {
  const { email, password } = req.body;

  // BUG 1: No input validation — email/password could be undefined
  const user = await db.query(`SELECT * FROM users WHERE email = '${email}'`);
  // BUG 2: SQL injection — string interpolation instead of parameterized query

  if (user.rows[0].password === password) {
    // BUG 3: Null dereference — user.rows[0] could be undefined if no user found
    // BUG 4: Plaintext password comparison — should use bcrypt.compare()
    const token = jwt.sign({ userId: user.rows[0].id }, process.env.JWT_SECRET);
    // BUG 5: JWT has no expiry set
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
}

module.exports = { loginUser };
