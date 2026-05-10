const Review = require('../models/Review');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const { syncHostRating } = require('../utils/trustSafety');

// Create a review
exports.createReview = async (req, res) => {
  try {
    const { eventId, rating, comment } = req.body;

    if (!eventId || !rating) {
      return res.status(400).json({ message: 'Event ID and rating are required' });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const hasConfirmedBooking = await Booking.exists({
      user: req.user.id,
      event: eventId,
      status: 'confirmed'
    });

    if (!hasConfirmedBooking) {
      return res.status(403).json({ message: 'Only confirmed attendees can review this host after the event' });
    }

    if (event.date && new Date(event.date) > new Date()) {
      return res.status(400).json({ message: 'Reviews open after the event date' });
    }

    // Check if user has already reviewed this event
    const existingReview = await Review.findOne({ user: req.user.id, event: eventId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this event' });
    }

    const review = new Review({
      user: req.user.id,
      event: eventId,
      host: event.organizer,
      rating,
      comment: comment || ''
    });

    await review.save();
    await syncHostRating(event.organizer, { req });

    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get reviews for an event
exports.getEventReviews = async (req, res) => {
  try {
    const { eventId } = req.params;
    const reviews = await Review.find({ event: eventId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({ reviews, averageRating: avgRating.toFixed(1), totalReviews: reviews.length });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's own reviews
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .populate('event', 'title image date')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update review
exports.updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const review = await Review.findOne({ _id: req.params.id, user: req.user.id });
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    if (!review.host) {
      const event = await Event.findById(review.event).select('organizer');
      if (event?.organizer) review.host = event.organizer;
    }

    await review.save();
    await syncHostRating(review.host, { req });
    res.json({ message: 'Review updated successfully', review });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, user: req.user.id });
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const hostId = review.host;
    await Review.findByIdAndDelete(req.params.id);
    await syncHostRating(hostId, { req });
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
