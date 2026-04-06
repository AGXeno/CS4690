require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const courseRoutes = require('./routes/courses');
const logRoutes = require('./routes/logs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

app.use('/courses', courseRoutes);
app.use('/logs', logRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
