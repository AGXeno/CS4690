require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Log = require('../models/Log');

async function setupTestDb() {
  await mongoose.connect(process.env.MONGO_URI);

  // Clean collections
  await User.deleteMany({});
  await Course.deleteMany({});
  await Log.deleteMany({});

  // Seed test admins
  await User.create({ username: 'root_uvu', password: 'willy', role: 'admin', tenant: 'uvu' });
  await User.create({ username: 'root_uofu', password: 'swoopy', role: 'admin', tenant: 'uofu' });

  // Seed a test course per tenant
  await Course.create({ _id: 'cs4660_uvu', display: 'CS 4660', tenant: 'uvu' });
  await Course.create({ _id: 'cs4660_uofu', display: 'CS 4660', tenant: 'uofu' });
}

async function teardownTestDb() {
  await User.deleteMany({});
  await Course.deleteMany({});
  await Log.deleteMany({});
  await mongoose.disconnect();
}

module.exports = { setupTestDb, teardownTestDb };
