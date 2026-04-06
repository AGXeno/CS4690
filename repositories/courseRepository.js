const Course = require('../models/Course');

class CourseRepository {
  async findAll() {
    return Course.find();
  }

  async findById(id) {
    return Course.findById(id);
  }

  async create(courseData) {
    return Course.create({ _id: courseData.id, display: courseData.display });
  }
}

module.exports = CourseRepository;
