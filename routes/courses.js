const express = require('express');
const router = express.Router({ mergeParams: true });
const { requireRole } = require('../middleware/rbac');
const CourseRepository = require('../repositories/courseRepository');
const UserRepository = require('../repositories/userRepository');
const courseRepo = new CourseRepository();
const userRepo = new UserRepository();

// GET /api/:tenant/courses — all authenticated users can list courses
router.get('/', async (req, res) => {
  try {
    const courses = await courseRepo.findAll(req.tenant);
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/:tenant/courses — admin and teacher only
router.post('/', requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const course = await courseRepo.create({
      id: req.body.id,
      display: req.body.display,
      tenant: req.tenant,
      createdBy: req.user.userId
    });
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/:tenant/courses/:courseId/join — student joins a course
router.post('/:courseId/join', requireRole('student'), async (req, res) => {
  try {
    const course = await courseRepo.findById(req.params.courseId, req.tenant);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    const user = await userRepo.addCourse(req.user.userId, req.params.courseId);
    res.json({ message: 'Joined course successfully', user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
