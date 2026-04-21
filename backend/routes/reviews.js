const express = require('express');
const router = express.Router();
const {
  createReview,
  getEventReviews,
  getMyReviews,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');
const { auth } = require('../middleware/auth');

// @route   POST /api/reviews
// @desc    Create a review
// @access  Private
router.post('/', auth, createReview);

// @route   GET /api/reviews/event/:eventId
// @desc    Get reviews for an event
// @access  Public
router.get('/event/:eventId', getEventReviews);

// @route   GET /api/reviews/my
// @desc    Get user's own reviews
// @access  Private
router.get('/my', auth, getMyReviews);

// @route   PUT /api/reviews/:id
// @desc    Update a review
// @access  Private
router.put('/:id', auth, updateReview);

// @route   DELETE /api/reviews/:id
// @desc    Delete a review
// @access  Private
router.delete('/:id', auth, deleteReview);

module.exports = router;
