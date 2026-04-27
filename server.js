require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const { tenantExtractor, authenticate } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const logRoutes = require('./routes/logs');
const userRoutes = require('./routes/users');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static assets (CSS, JS, images) from public/
app.use('/public', express.static(path.join(__dirname, 'public')));
// Serve node_modules for Bootstrap/jQuery fallbacks
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// --- Page routes (serve HTML) ---

// Root redirect → pick a tenant
app.get('/', (req, res) => {
  res.redirect('/uvu/login');
});

const VALID_TENANTS = ['uvu', 'uofu'];

// Login page — no auth required
app.get('/:tenant/login', (req, res) => {
  if (!VALID_TENANTS.includes(req.params.tenant)) {
    return res.redirect('/uvu/login');
  }
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Dashboard pages — served to client, auth checked client-side via JWT
app.get('/:tenant/admin', (req, res) => {
  if (!VALID_TENANTS.includes(req.params.tenant)) {
    return res.redirect('/uvu/login');
  }
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/:tenant/teacher', (req, res) => {
  if (!VALID_TENANTS.includes(req.params.tenant)) {
    return res.redirect('/uvu/login');
  }
  res.sendFile(path.join(__dirname, 'public', 'teacher.html'));
});

app.get('/:tenant/student', (req, res) => {
  if (!VALID_TENANTS.includes(req.params.tenant)) {
    return res.redirect('/uvu/login');
  }
  res.sendFile(path.join(__dirname, 'public', 'student.html'));
});

// --- API routes ---

// Auth routes (no JWT required)
app.use('/api/:tenant/auth', tenantExtractor, authRoutes);

// Protected routes (JWT + tenant required)
app.use('/api/:tenant/courses', tenantExtractor, authenticate, courseRoutes);
app.use('/api/:tenant/logs', tenantExtractor, authenticate, logRoutes);
app.use('/api/:tenant/users', tenantExtractor, authenticate, userRoutes);

// --- Start server ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
      console.log(`  UVU:  http://localhost:${port}/uvu/login`);
      console.log(`  UofU: http://localhost:${port}/uofu/login`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;
