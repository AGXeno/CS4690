const Course = require('../models/Course');

class CourseRepository {
  async findAll(tenant) {
    return Course.find({ tenant });
  }

  async findById(id, tenant) {
    return Course.findOne({ _id: id, tenant });
  }

  async create(courseData) {
    return Course.create({
      _id: courseData.id,
      display: courseData.display,
      tenant: courseData.tenant,
      createdBy: courseData.createdBy
    });
  }
}

module.exports = CourseRepository;
