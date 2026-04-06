const Log = require('../models/Log');

class LogRepository {
  async findAll(query = {}) {
    return Log.find(query);
  }

  async create(logData) {
    return Log.create(logData);
  }
}

module.exports = LogRepository;
