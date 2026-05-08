const express = require('express');
const router = express.Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist
} = require('../controllers/wishlistController');
const { auth } = require('../middleware/auth');

// @route   GET /api/wishlist
// @desc    Get user's wishlist
// @access  Private
router.get('/', auth, getWishlist);

// @route   POST /api/wishlist
// @desc    Add event to wishlist
// @access  Private
router.post('/', auth, addToWishlist);

// @route   DELETE /api/wishlist/:eventId
// @desc    Remove event from wishlist
// @access  Private
router.delete('/:eventId', auth, removeFromWishlist);

// @route   GET /api/wishlist/check/:eventId
// @desc    Check if event is in wishlist
// @access  Private
router.get('/check/:eventId', auth, checkWishlist);

module.exports = router;
