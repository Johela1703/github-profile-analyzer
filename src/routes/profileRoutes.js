/**
 * profileRoutes.js
 *
 * Maps HTTP verbs + paths to controller handlers.
 * Input validation is defined here using express-validator.
 */

const express    = require('express');
const { param }  = require('express-validator');
const controller = require('../controllers/profileController');

const router = express.Router();

// Reusable username validator
const validateUsername = param('username')
  .trim()
  .notEmpty().withMessage('Username cannot be empty.')
  .isLength({ max: 100 }).withMessage('Username too long.')
  .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Invalid GitHub username format.');

// POST  /api/profiles/analyze/:username  — Fetch from GitHub & store
router.post('/analyze/:username', validateUsername, controller.analyzeAndStore);

// GET   /api/profiles                   — List all stored profiles
router.get('/', controller.getAllProfiles);

// GET   /api/profiles/:username         — Get a single stored profile
router.get('/:username', validateUsername, controller.getProfile);

// DELETE /api/profiles/:username        — Remove a stored profile
router.delete('/:username', validateUsername, controller.deleteProfile);

module.exports = router;
