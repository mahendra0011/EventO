const Message = require('../models/Message');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const User = require('../models/User');

// Send message from host to user
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, eventId, subject, content, bookingId } = req.body;

    // Verify sender is a host
    if (req.user.role !== 'host') {
      return res.status(403).json({ message: 'Only hosts can send messages' });
    }

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate event exists and belongs to host
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only send messages for your own events' });
    }

    // Validate booking if provided
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (!booking || booking.event.toString() !== eventId || booking.user.toString() !== receiverId) {
        return res.status(400).json({ message: 'Invalid booking for this event and user' });
      }
    }

    const message = new Message({
      sender: req.user.id,
      receiver: receiverId,
      event: eventId,
      booking: bookingId || null,
      subject,
      content
    });

    await message.save();
    await message.populate(['sender', 'receiver', 'event']);

    // Create notification for receiver
    const Notification = require('../models/Notification');
    await Notification.create({
      user: receiverId,
      title: `New message from ${req.user.name}`,
      message: subject,
      type: 'system',
      link: '/dashboard/messages'
    });

    res.status(201).json({ message: 'Message sent successfully', data: message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's inbox (all conversations)
exports.getInbox = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get distinct conversations grouped by sender (for received messages)
    const conversations = await Message.aggregate([
      { $match: { receiver: mongoose.Types.ObjectId(req.user.id) } },
      { $sort: { createdAt: -1 } },
      { $group: {
          _id: '$sender',
          lastMessage: { $first: '$$ROOT' },
          count: { $sum: 1 },
          unreadCount: { 
            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
          }
        }
      },
      { $skip: skip },
      { $limit: limit * 1 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'sender'
        }
      },
      { $unwind: '$sender' },
      {
        $project: {
          sender: {
            _id: '$sender._id',
            name: '$sender.name',
            email: '$sender.email'
          },
          lastMessage: 1,
          count: 1,
          unreadCount: 1
        }
      }
    ]);

    const total = await Message.countDocuments({ receiver: req.user.id });
    const totalUnread = await Message.countDocuments({ receiver: req.user.id, isRead: false });

    res.json({
      conversations,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalConversations: total,
      totalUnread
    });
  } catch (error) {
    console.error('Get inbox error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get messages in a specific conversation (with a user)
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Get all messages between current user and specified user
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id }
      ]
    })
    .populate('sender', 'name email role')
    .populate('receiver', 'name email role')
    .populate('event', 'title date')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit * 1);

    const total = await Message.countDocuments({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id }
      ]
    });

    // Mark as read if I'm the receiver
    await Message.updateMany(
      { receiver: req.user.id, sender: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.json({
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalMessages: total
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get host's sent messages (to users)
exports.getSentMessages = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ sender: req.user.id })
      .populate('receiver', 'name email')
      .populate('event', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit * 1);

    const total = await Message.countDocuments({ sender: req.user.id });

    res.json({
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalMessages: total
    });
  } catch (error) {
    console.error('Get sent messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark conversation as read (all messages from a specific sender)
exports.markConversationAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    await Message.updateMany(
      { receiver: req.user.id, sender: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.json({ message: 'Conversation marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get host's conversations (unique users who have messaged or received messages)
exports.getHostConversations = async (req, res) => {
  try {
    if (req.user.role !== 'host') {
      return res.status(403).json({ message: 'Only hosts can access this' });
    }

    // Get all distinct conversations involving the host
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: mongoose.Types.ObjectId(req.user.id) },
            { receiver: mongoose.Types.ObjectId(req.user.id) }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', mongoose.Types.ObjectId(req.user.id)] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          count: { $sum: 1 },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$receiver', mongoose.Types.ObjectId(req.user.id)] },
                  { $eq: ['$isRead', false] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          user: {
            _id: '$user._id',
            name: '$user.name',
            email: '$user.email'
          },
          lastMessage: 1,
          count: 1,
          unreadCount: 1
        }
      }
    ]);

    res.json({ conversations });
  } catch (error) {
    console.error('Get host conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get users who have booked host's events (for initiating new conversations)
exports.getEventAttendees = async (req, res) => {
  try {
    if (req.user.role !== 'host') {
      return res.status(403).json({ message: 'Only hosts can access this' });
    }

    // Get all bookings for host's events (confirmed only)
    const hostEvents = await Event.find({ organizer: req.user.id });
    const hostEventIds = hostEvents.map(e => e._id);

    const bookings = await Booking.find({
      event: { $in: hostEventIds },
      status: 'confirmed'
    }).populate('user', 'name email');

    // Get unique users
    const users = [...new Map(bookings.map(b => [b.user._id.toString(), b.user])).values()];

    res.json({ users });
  } catch (error) {
    console.error('Get event attendees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete message (only sender can delete)
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.id,
      $or: [
        { sender: req.user.id },
        { receiver: req.user.id }
      ]
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only sender can delete
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
