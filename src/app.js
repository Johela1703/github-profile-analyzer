/**
 * app.js
 *
 * Express application factory.
 * Sets up middleware, mounts routes, and attaches error handlers.
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const errorHandler = require('./middleware/errorHandler');
const profileRoutes = require('./routes/profileRoutes');

const app = express();

// ------------------------------------------------------
// Middleware
// ------------------------------------------------------

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
  extended: true
}));

app.use(
  morgan(
    process.env.NODE_ENV === 'production'
      ? 'combined'
      : 'dev'
  )
);

// ------------------------------------------------------
// Root Endpoint
// ------------------------------------------------------

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'GitHub Profile Analyzer API',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: {
      health: 'GET /api/health',
      analyze: 'POST /api/profiles/analyze/:username',
      profiles: 'GET /api/profiles',
      profile: 'GET /api/profiles/:username',
      delete: 'DELETE /api/profiles/:username'
    }
  });
});

// ------------------------------------------------------
// Health Check
// ------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    service: 'GitHub Profile Analyzer API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ------------------------------------------------------
// API Routes
// ------------------------------------------------------

app.use('/api/profiles', profileRoutes);

// ------------------------------------------------------
// 404 Handler
// ------------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} does not exist.`
  });
});

// ------------------------------------------------------
// Error Handler
// ------------------------------------------------------

app.use(errorHandler);

module.exports = app;