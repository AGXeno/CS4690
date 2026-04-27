const User = require('../models/User');

class UserRepository {
  async findByUsername(username, tenant) {
    return User.findOne({ username, tenant });
  }

  async findById(id) {
    return User.findById(id);
  }

  async findAll(tenant, query = {}) {
    return User.find({ tenant, ...query });
  }

  async findByRole(tenant, role) {
    return User.find({ tenant, role });
  }

  async create(userData) {
    return User.create(userData);
  }

  async addCourse(userId, courseId) {
    return User.findByIdAndUpdate(
      userId,
      { $addToSet: { courses: courseId } },
      { new: true }
    );
  }
}

module.exports = UserRepository;
