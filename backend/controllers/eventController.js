const Event = require('../models/Event');
const Category = require('../models/Category');
const {
  getHostPublishReadiness,
  refundBookingsForEvent
} = require('../utils/trustSafety');
const { logActivity } = require('../utils/activity');

const organizerPublicFields = 'name email phone hostTrust hostVerification phoneVerification bankAccount';

const addPublicEventFilters = (query, extraConditions = []) => {
  const conditions = [
    {
      $or: [
        { publishStatus: 'published' },
        { publishStatus: { $exists: false } }
      ]
    },
    ...extraConditions
  ];

  return {
    ...query,
    isActive: true,
    moderationStatus: 'approved',
    $and: conditions
  };
};

// Get active event categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ name: 1 })
      .select('name description isActive');

    res.json(categories.map((category) => category.name));
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all events
exports.getEvents = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    
    const extraConditions = [];
    let query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      extraConditions.push({ $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } }
      ] });
    }

    query = addPublicEventFilters(query, extraConditions);

    const events = await Event.find(query)
      .populate('organizer', organizerPublicFields)
      .sort({ date: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Event.countDocuments(query);

    res.json({
      events,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalEvents: count
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single event
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', organizerPublicFields);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const isPublished = event.isActive &&
      event.moderationStatus === 'approved' &&
      (!event.publishStatus || event.publishStatus === 'published');

    if (!isPublished) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create event (Host only)
exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      venue,
      location,
      category,
      image,
      price,
      totalTickets,
      tags
    } = req.body;

    // Validation
    if (!title || !description || !date || !time || !venue || !location || !category) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Convert date string to Date object
    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const readiness = await getHostPublishReadiness(req.user);

    if (!readiness.canCreate) {
      return res.status(403).json({
        message: `New hosts can create up to ${readiness.eventLimit} event(s) before verification. Complete KYC to continue.`,
        publishReadiness: readiness
      });
    }

    const event = new Event({
      title,
      description,
      date: eventDate,
      time,
      venue,
      location,
      category,
      image: image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      price: price || 0,
      totalTickets: totalTickets || 100,
      organizer: req.user.id,
      tags: tags || [],
      isActive: readiness.canPublish,
      moderationStatus: readiness.canPublish ? 'approved' : 'pending',
      publishStatus: readiness.canPublish ? 'published' : 'pending_verification',
      moderationNotes: readiness.canPublish ? '' : readiness.message
    });

    await event.save();

    res.status(201).json({
      event,
      publishReadiness: readiness,
      message: readiness.canPublish
        ? 'Event created and published successfully'
        : 'Event saved but not published. Complete host verification to publish.'
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update event (Host only)
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const allowedFields = [
      'title',
      'description',
      'date',
      'time',
      'venue',
      'location',
      'category',
      'image',
      'price',
      'totalTickets',
      'tags'
    ];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    if (updates.date) updates.date = new Date(updates.date);

    const readiness = await getHostPublishReadiness(req.user);
    const isSuspended = event.publishStatus === 'suspended';
    updates.isActive = readiness.canPublish && !isSuspended;
    updates.moderationStatus = isSuspended ? event.moderationStatus : (readiness.canPublish ? 'approved' : 'pending');
    updates.publishStatus = isSuspended ? 'suspended' : (readiness.canPublish ? 'published' : 'pending_verification');
    updates.moderationNotes = isSuspended
      ? event.moderationNotes
      : (readiness.canPublish ? event.moderationNotes : readiness.message);

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({ event: updatedEvent, publishReadiness: readiness });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete event (Host only)
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    event.isActive = false;
    event.publishStatus = 'cancelled';
    event.moderationStatus = 'rejected';
    event.suspensionReason = 'Cancelled by host';
    await event.save();

    const refundResult = await refundBookingsForEvent(event._id, {
      req,
      reason: `Event "${event.title}" was cancelled by the host`
    });

    await logActivity({
      req,
      action: 'event.cancelled_by_host',
      entity: 'Event',
      entityId: event._id,
      message: `Host cancelled event ${event.title}`,
      metadata: refundResult
    });

    res.json({ message: 'Event cancelled and eligible bookings refunded', refundResult });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get events by organizer (Admin)
exports.getOrganizerEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user.id })
      .sort({ createdAt: -1 });

    res.json(events);
  } catch (error) {
    console.error('Get organizer events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get featured events
exports.getFeaturedEvents = async (req, res) => {
  try {
    const featuredEvents = await Event.find(addPublicEventFilters({ isFeatured: true }))
      .sort({ date: 1 })
      .limit(6)
      .populate('organizer', 'name hostTrust hostVerification');

    if (featuredEvents.length >= 6) {
      return res.json(featuredEvents);
    }

    const fallbackEvents = await Event.find({
      ...addPublicEventFilters({}),
      _id: { $nin: featuredEvents.map((event) => event._id) }
    })
      .sort({ isTrending: -1, date: 1 })
      .limit(6 - featuredEvents.length)
      .populate('organizer', 'name hostTrust hostVerification');

    res.json([...featuredEvents, ...fallbackEvents]);
  } catch (error) {
    console.error('Get featured events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
