const mongoose = require('mongoose');
const Message = require('../models/Message');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { sendHostMessageEmail } = require('../utils/email');

// Send message from user or host
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, eventId, subject, content, bookingId } = req.body;

    // Validate sender exists
    const sender = await User.findById(req.user.id);
    if (!sender) {
      return res.status(404).json({ message: 'Sender not found' });
    }

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Authorization checks based on sender role
    if (sender.role === 'user') {
      // Users can only message event hosts (organizers)
      if (receiver.role !== 'host') {
        return res.status(403).json({ message: 'You can only message event hosts' });
      }
      // Verify the host is the organizer of this event
      if (event.organizer.toString() !== receiverId) {
        return res.status(403).json({ message: 'You can only message the organizer of this event' });
      }
      // For users, event is required
      if (!eventId) {
        return res.status(400).json({ message: 'Event is required when messaging a host' });
      }
    } else if (sender.role === 'host') {
      // Hosts can only message users who have booked their events
      if (event.organizer.toString() !== req.user.id) {
        return res.status(403).json({ message: 'You can only send messages for your own events' });
      }
      // Verify the receiver has booked this event (confirmed booking)
      const booking = await Booking.findOne({
        event: eventId,
        user: receiverId,
        status: 'confirmed'
      });
      if (!booking) {
        return res.status(403).json({ message: 'User has not confirmed attendance for this event' });
      }
      // Validate bookingId if provided
      if (bookingId) {
        const specifiedBooking = await Booking.findById(bookingId);
        if (!specifiedBooking || specifiedBooking.event.toString() !== eventId || specifiedBooking.user.toString() !== receiverId) {
          return res.status(400).json({ message: 'Invalid booking for this event and user' });
        }
      }
    }

    const message = new Message({
      sender: req.user.id,
      receiver: receiverId,
      event: eventId,
      booking: bookingId || null,
      subject,
      content,
      isPublic: false
    });

    await message.save();
    await message.populate(['sender', 'receiver', 'event']);

    // Create notification for receiver
    const Notification = require('../models/Notification');
    await Notification.create({
      user: receiverId,
      title: `New message from ${sender.name}`,
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

// Post public message for community chat (event attendees)
exports.postCommunityMessage = async (req, res) => {
  try {
    const { eventId, content } = req.body;

    // Validate event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    let booking = null;

    // Authorization: hosts can always post to their event's community chat
    if (req.user.role === 'host') {
      // Verify host is the organizer of this event
      if (event.organizer.toString() !== req.user.id) {
        return res.status(403).json({ message: 'You can only post for your own events' });
      }
    } else {
      // For regular users, verify they have a confirmed booking
      booking = await Booking.findOne({
        event: eventId,
        user: req.user.id,
        status: 'confirmed'
      });
      if (!booking) {
        return res.status(403).json({ message: 'Only attendees can post in community chat' });
      }
    }

    const message = new Message({
      sender: req.user.id,
      receiver: event.organizer, // Store organizer as receiver for reference
      event: eventId,
      booking: booking ? booking._id : null, // Hosts have no booking
      subject: 'Community Chat',
      content,
      isPublic: true
    });

    await message.save();
    await message.populate(['sender', 'event']);

    res.status(201).json({ message: 'Message posted to community chat', data: message });
  } catch (error) {
    console.error('Post community message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get public messages for an event (community chat)
exports.getCommunityMessages = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Validate event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Authorization: hosts can always view their event's community chat
    // Regular users must have a confirmed booking
    if (req.user.role !== 'host') {
      const booking = await Booking.findOne({
        event: eventId,
        user: req.user.id,
        status: 'confirmed'
      });
      if (!booking) {
        return res.status(403).json({ message: 'Only attendees can view community chat' });
      }
    } else if (event.organizer.toString() !== req.user.id) {
      // Hosts can only view their own events' community chat
      return res.status(403).json({ message: 'You can only view community for your own events' });
    }

    const messages = await Message.find({
      event: eventId,
      isPublic: true
    })
    .populate('sender', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit * 1);

    const total = await Message.countDocuments({
      event: eventId,
      isPublic: true
    });

    // Get pinned message for this event if any
    const pinnedMessage = await Message.findOne({
      event: eventId,
      isPublic: true,
      isPinned: true
    }).populate('sender', 'name email');

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalMessages: total,
      pinnedMessage: pinnedMessage || null
    });
  } catch (error) {
    console.error('Get community messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Broadcast message to all confirmed attendees of an event
exports.broadcastMessage = async (req, res) => {
  try {
    const { eventId, subject, content } = req.body;

    // Verify sender is a host
    if (req.user.role !== 'host') {
      return res.status(403).json({ message: 'Only hosts can broadcast messages' });
    }

    // Validate event exists and belongs to host
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only broadcast for your own events' });
    }

    // Get all confirmed bookings for this event
    const bookings = await Booking.find({
      event: eventId,
      status: 'confirmed'
    }).populate('user', 'name email');

    if (bookings.length === 0) {
      return res.status(400).json({ message: 'No confirmed attendees found for this event' });
    }

    // Get unique users (in case same user booked multiple times)
    const uniqueUsers = [...new Map(bookings.map(b => [b.user._id.toString(), b.user])).values()];

    // Send message to each user
    const sentMessages = [];
    const failedEmails = [];

    for (const user of uniqueUsers) {
      try {
        const message = new Message({
          sender: req.user.id,
          receiver: user._id,
          event: eventId,
          booking: null, // No specific booking for broadcast
          subject,
          content
        });

        await message.save();
        sentMessages.push(message);

        // Send email notification
        try {
          await sendHostMessageEmail(user.email, user.name, subject, content, event.title, req.user.name);
        } catch (emailErr) {
          console.error(`Failed to send email to ${user.email}:`, emailErr);
          failedEmails.push(user.email);
        }

        // Create notification
        const Notification = require('../models/Notification');
        await Notification.create({
          user: user._id,
          title: `Broadcast from ${req.user.name} - ${event.title}`,
          message: subject,
          type: 'system',
          link: '/dashboard/messages'
        });
      } catch (err) {
        console.error(`Failed to send message to ${user.name}:`, err);
      }
    }

    // Populate messages for response
    await Promise.all(sentMessages.map(msg => msg.populate(['sender', 'receiver', 'event'])));

    res.status(201).json({
      message: `Broadcast sent to ${sentMessages.length} users`,
      data: {
        totalSent: sentMessages.length,
        failedEmails: failedEmails.length,
        recipients: uniqueUsers.length
      }
    });
  } catch (error) {
    console.error('Broadcast message error:', error);
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

// Pin/Unpin a community message (host only)
exports.pinMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('event', 'organizer');

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only host of the event can pin messages
    if (message.event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only event host can pin messages' });
    }

    // Update pinned status
    message.isPinned = req.body.pinned !== undefined ? req.body.pinned : true;
    await message.save();

    // If pinning, unpin other messages in this event
    if (message.isPinned) {
      await Message.updateMany(
        {
          event: message.event._id,
          _id: { $ne: message._id }
        },
        { $set: { isPinned: false } }
      );
    }

    await message.populate('sender', 'name email');
    res.json({ message: 'Message pinned successfully', data: message });
  } catch (error) {
    console.error('Pin message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
