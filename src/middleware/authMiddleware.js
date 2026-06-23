// middleware/authMiddleware.js — JWT verification middleware
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.headers['authorization'];
  // BUG 1: Does not strip "Bearer " prefix — token will fail verification

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // BUG 2: Catches ALL errors including server errors, always returns 401
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// Style: could use arrow function (NOT a bug — cosmetic only)
module.exports = authMiddleware;
