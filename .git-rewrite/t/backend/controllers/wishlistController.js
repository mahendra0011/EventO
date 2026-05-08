const Wishlist = require('../models/Wishlist');
const Event = require('../models/Event');

// Get user's wishlist
exports.getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.find({ user: req.user.id })
      .populate('event')
      .sort({ createdAt: -1 });

    res.json(wishlist);
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add event to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if already in wishlist
    const existing = await Wishlist.findOne({ user: req.user.id, event: eventId });
    if (existing) {
      return res.status(400).json({ message: 'Event already in wishlist' });
    }

    const wishlistItem = new Wishlist({
      user: req.user.id,
      event: eventId
    });

    await wishlistItem.save();
    res.status(201).json({ message: 'Added to wishlist', wishlistItem });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove event from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const { eventId } = req.params;

    const wishlistItem = await Wishlist.findOne({ user: req.user.id, event: eventId });
    if (!wishlistItem) {
      return res.status(404).json({ message: 'Event not in wishlist' });
    }

    await Wishlist.findByIdAndDelete(wishlistItem._id);
    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if event is in user's wishlist
exports.checkWishlist = async (req, res) => {
  try {
    const { eventId } = req.params;

    const wishlistItem = await Wishlist.findOne({ user: req.user.id, event: eventId });
    res.json({ inWishlist: !!wishlistItem });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
