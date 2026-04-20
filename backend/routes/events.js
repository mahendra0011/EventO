const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
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
router.post('/', hostAuth, [
  check('title', 'Title is required').not().isEmpty(),
  check('description', 'Description is required').not().isEmpty(),
  check('date', 'Date is required').not().isEmpty(),
  check('time', 'Time is required').not().isEmpty(),
  check('venue', 'Venue is required').not().isEmpty(),
  check('location', 'Location is required').not().isEmpty(),
  check('category', 'Category is required').not().isEmpty(),
  check('price', 'Price is required').isNumeric(),
  check('totalTickets', 'Total tickets is required').isNumeric()
], createEvent);

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private/Host
router.put('/:id', hostAuth, updateEvent);

// @route   DELETE /api/events/:id
// @desc    Delete event
// @access  Private/Host
router.delete('/:id', hostAuth, deleteEvent);

module.exports = router;
