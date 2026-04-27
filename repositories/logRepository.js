const Log = require('../models/Log');

class LogRepository {
  async findAll(tenant, query = {}) {
    return Log.find({ tenant, ...query });
  }

  async create(logData) {
    return Log.create(logData);
  }
}

module.exports = LogRepository;
