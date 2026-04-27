const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router({ mergeParams: true });
const UserRepository = require('../repositories/userRepository');
const userRepo = new UserRepository();

const VALID_TENANTS = ['uvu', 'uofu'];

// POST /api/:tenant/auth/login
router.post('/login', async (req, res) => {
  try {
    const { tenant } = req.params;
    if (!VALID_TENANTS.includes(tenant)) {
      return res.status(400).json({ error: 'Invalid tenant' });
    }

    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await userRepo.findByUsername(username, tenant);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role, tenant: user.tenant },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/:tenant/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { tenant } = req.params;
    if (!VALID_TENANTS.includes(tenant)) {
      return res.status(400).json({ error: 'Invalid tenant' });
    }

    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, and role are required' });
    }

    // Self-signup is only allowed for teacher and student
    if (!['teacher', 'student'].includes(role)) {
      return res.status(403).json({ error: 'Can only self-register as teacher or student' });
    }

    const existing = await userRepo.findByUsername(username, tenant);
    if (existing) {
      return res.status(409).json({ error: 'Username already exists for this institution' });
    }

    const user = await userRepo.create({ username, password, role, tenant });

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role, tenant: user.tenant },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(201).json({ token, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
