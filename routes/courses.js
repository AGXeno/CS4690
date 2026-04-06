const express = require('express');
const router = express.Router();
const CourseRepository = require('../repositories/courseRepository');
const courseRepo = new CourseRepository();

router.get('/', async (req, res) => {
  try {
    const courses = await courseRepo.findAll();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const course = await courseRepo.create(req.body);
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
