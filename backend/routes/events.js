const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getOrganizerEvents,
  getFeaturedEvents
} = require('../controllers/eventController');
const { auth, hostAuth } = require('../middleware/auth');

// @route   GET /api/events/featured
// @desc    Get featured events
// @access  Public
router.get('/featured', getFeaturedEvents);

// @route   GET /api/events/organizer
// @desc    Get events by organizer
// @access  Private/Host
router.get('/organizer', hostAuth, getOrganizerEvents);

// @route   GET /api/events
// @desc    Get all events
// @access  Public
router.get('/', getEvents);

// @route   GET /api/events/:id
// @desc    Get single event
// @access  Public
router.get('/:id', getEvent);

// @route   POST /api/events
// @desc    Create event
// @access  Private/Host
router.post('/', hostAuth, createEvent);

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private/Host
router.put('/:id', hostAuth, updateEvent);

// @route   DELETE /api/events/:id
// @desc    Delete event
// @access  Private/Host
router.delete('/:id', hostAuth, deleteEvent);

module.exports = router;
