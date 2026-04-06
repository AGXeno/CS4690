require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');
const Log = require('./models/Log');
const data = require('./db.json');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await Course.deleteMany({});
  await Log.deleteMany({});

  await Course.insertMany(data.courses.map(c => ({ _id: c.id, display: c.display })));
  console.log(`Seeded ${data.courses.length} courses`);

  await Log.insertMany(data.logs.map(({ id, ...rest }) => rest));
  console.log(`Seeded ${data.logs.length} logs`);

  await mongoose.disconnect();
  console.log('Done!');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
