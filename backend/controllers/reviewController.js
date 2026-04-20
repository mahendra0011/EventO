const Review = require('../models/Review');
const Booking = require('../models/Booking');

// Create a review
exports.createReview = async (req, res) => {
  try {
    const { eventId, rating, comment } = req.body;
    
    // Check if user attended the event
    const booking = await Booking.findOne({
      user: req.user.id,
      event: eventId,
      status: 'confirmed'
    });

    if (!booking) {
      return res.status(403).json({ message: 'You must have a confirmed booking to review this event' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      user: req.user.id,
      event: eventId
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this event' });
    }

    const review = new Review({
      user: req.user.id,
      event: eventId,
      rating,
      comment
    });

    await review.save();
    res.status(201).json(review);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get reviews for an event
exports.getEventReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ event: req.params.eventId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(reviews);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's reviews
exports.getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .populate('event', 'title date image')
      .sort({ createdAt: -1 });
    
    res.json(reviews);
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get event average rating
exports.getEventRating = async (req, res) => {
  try {
    const result = await Review.aggregate([
      { $match: { event: require('mongoose').Types.ObjectId(req.params.eventId) } },
      { $group: { _id: null, averageRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    if (result.length > 0) {
      res.json({ averageRating: result[0].averageRating.toFixed(1), count: result[0].count });
    } else {
      res.json({ averageRating: 0, count: 0 });
    }
  } catch (error) {
    console.error('Get rating error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};