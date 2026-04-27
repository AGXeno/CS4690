const express = require('express');
const router = express.Router({ mergeParams: true });
const LogRepository = require('../repositories/logRepository');
const logRepo = new LogRepository();

// GET /api/:tenant/logs — filtered by role
router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.courseId) query.courseId = req.query.courseId;
    if (req.query.uvuId) query.uvuId = req.query.uvuId;

    // Students can only see their own logs
    if (req.user.role === 'student') {
      query.userId = req.user.userId;
    }

    const logs = await logRepo.findAll(req.tenant, query);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/:tenant/logs — all authenticated users can create logs
router.post('/', async (req, res) => {
  try {
    const log = await logRepo.create({
      courseId: req.body.courseId,
      uvuId: req.body.uvuId,
      date: req.body.date || new Date().toISOString(),
      text: req.body.text,
      tenant: req.tenant,
      userId: req.user.userId
    });
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
