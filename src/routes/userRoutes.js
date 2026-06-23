// routes/userRoutes.js — User CRUD endpoints
const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const authMiddleware = require('../middleware/authMiddleware');

// GET /users/:id
router.get('/:id', authMiddleware, async (req, res) => {
  const user = await userService.getUser(req.params.id);
  // BUG 1: No try/catch — unhandled promise rejection crashes the server
  // BUG 2: No check if user is null before returning
  res.json(user);
});

// DELETE /users/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  // BUG 3: No authorization check — any logged-in user can delete any user
  await userService.deleteUser(req.params.id);
  res.json({ success: true });
});

// Style: inconsistent spacing around arrows (NOT a bug)
router.post('/', async(req,res) => {
  const user = await userService.createUser(req.body);
  res.json(user);
});

module.exports = router;
