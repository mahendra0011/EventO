const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/auth');
const { createReview, getEventReviews, getUserReviews, getEventRating } = require('../controllers/reviewController');

// @route   POST /api/reviews
// @desc    Create a review
// @access  Private
router.post('/', auth, [
  check('eventId', 'Event ID is required').not().isEmpty(),
  check('rating', 'Rating is required (1-5)').isInt({ min: 1, max: 5 })
], createReview);

// @route   GET /api/reviews/event/:eventId
// @desc    Get reviews for an event
// @access  Public
router.get('/event/:eventId', getEventReviews);

// @route   GET /api/reviews/event/:eventId/rating
// @desc    Get average rating for an event
// @access  Public
router.get('/event/:eventId/rating', getEventRating);

// @route   GET /api/reviews/user
// @desc    Get user's reviews
// @access  Private
router.get('/user', auth, getUserReviews);

module.exports = router;