const express = require('express');
const router = express.Router();
const LogRepository = require('../repositories/logRepository');
const logRepo = new LogRepository();

router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.courseId) query.courseId = req.query.courseId;
    if (req.query.uvuId) query.uvuId = req.query.uvuId;
    const logs = await logRepo.findAll(query);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const log = await logRepo.create(req.body);
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
