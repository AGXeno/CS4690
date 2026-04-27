const express = require('express');
const router = express.Router({ mergeParams: true });
const { requireRole } = require('../middleware/rbac');
const UserRepository = require('../repositories/userRepository');
const userRepo = new UserRepository();

// GET /api/:tenant/users — admin sees all, teacher sees students
router.get('/', requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const query = {};
    if (req.query.role) query.role = req.query.role;

    // Teachers can only see students
    if (req.user.role === 'teacher') {
      query.role = 'student';
    }

    const users = await userRepo.findAll(req.tenant, query);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/:tenant/users — create a user (admin can create any, teacher can create students)
router.post('/', requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, and role are required' });
    }

    // Teachers can only create students
    if (req.user.role === 'teacher' && role !== 'student') {
      console.log(
        `[RBAC] Teacher "${req.user.username}" tried to create a ${role} account`
      );
      return res.status(403).json({ error: 'Teachers can only create students' });
    }

    // Only admins can create admins
    if (role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create admin accounts' });
    }

    const existing = await userRepo.findByUsername(username, req.tenant);
    if (existing) {
      return res.status(409).json({ error: 'Username already exists for this institution' });
    }

    const user = await userRepo.create({
      username,
      password,
      role,
      tenant: req.tenant
    });

    res.status(201).json(user.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/:tenant/users/me — get current user info
router.get('/me', async (req, res) => {
  try {
    const user = await userRepo.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
