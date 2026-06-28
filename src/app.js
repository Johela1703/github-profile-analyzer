/**
 * app.js
 *
 * Express application factory.
 * Sets up middleware, mounts routes, and attaches error handlers.
 */

const express      = require('express');
const cors         = require('cors');
const morgan       = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const profileRoutes = require('./routes/profileRoutes');

const app = express();

// ----------------------------------------------------------------
// Core middleware
// ----------------------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ----------------------------------------------------------------
// Health check — no auth, no DB required
// ----------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status:  'ok',
    service: 'GitHub Profile Analyzer API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ----------------------------------------------------------------
// API Routes
// ----------------------------------------------------------------
app.use('/api/profiles', profileRoutes);

// ----------------------------------------------------------------
// 404 catch-all for unknown routes
// ----------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error:   'Not Found',
    message: `Route ${req.method} ${req.originalUrl} does not exist.`,
  });
});

// ----------------------------------------------------------------
// Centralised error handler (must be last)
// ----------------------------------------------------------------
app.use(errorHandler);

module.exports = app;
