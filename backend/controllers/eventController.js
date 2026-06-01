const Event = require('../models/Event');
const Category = require('../models/Category');

const PUBLIC_SALES_QUERY = {
  $or: [
    { ticketSaleStatus: { $exists: false } },
    { ticketSaleStatus: { $in: ['live', 'sold_out'] } }
  ]
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildCityLocationQuery = (city) => {
  const trimmedCity = String(city || '').trim();
  if (!trimmedCity) return null;

  return {
    location: {
      $regex: `(^|[,\\s])${escapeRegex(trimmedCity)}([,\\s]|$)`,
      $options: 'i'
    }
  };
};

const normalizeTicketCategories = (ticketCategories, fallbackPrice, fallbackQuantity) => {
  const categories = Array.isArray(ticketCategories) ? ticketCategories : [];
  const normalized = categories
    .map((category) => ({
      name: (category.name || '').trim(),
      description: (category.description || '').trim(),
      price: Math.max(0, toNumber(category.price, fallbackPrice)),
      quantity: Math.max(1, Math.floor(toNumber(category.quantity, 1))),
      availableQuantity: category.availableQuantity !== undefined
        ? Math.max(0, Math.floor(toNumber(category.availableQuantity, category.quantity || 1)))
        : Math.max(1, Math.floor(toNumber(category.quantity, 1))),
      saleStart: category.saleStart ? new Date(category.saleStart) : undefined,
      saleEnd: category.saleEnd ? new Date(category.saleEnd) : undefined,
      isActive: category.isActive !== false
    }))
    .filter((category) => category.name);

  if (normalized.length > 0) {
    return normalized.map((category) => ({
      ...category,
      availableQuantity: Math.min(category.availableQuantity, category.quantity)
    }));
  }

  const quantity = Math.max(1, Math.floor(toNumber(fallbackQuantity, 100)));
  return [{
    name: 'General',
    price: Math.max(0, toNumber(fallbackPrice, 0)),
    quantity,
    availableQuantity: quantity,
    isActive: true
  }];
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
    const { category, search, city, page = 1, limit = 10 } = req.query;
    
    let query = {
      isActive: true,
      moderationStatus: 'approved',
      $and: [PUBLIC_SALES_QUERY]
    };
    
    if (category) {
      query.category = category;
    }

    const cityLocationQuery = buildCityLocationQuery(city);
    if (cityLocationQuery) {
      query.$and.push(cityLocationQuery);
    }
    
    if (search) {
      query.$and.push({ $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ] });
    }

    const events = await Event.find(query)
      .populate('organizer', 'name email phone')
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
      .populate('organizer', 'name email phone');

    if (!event) {
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
      eventType,
      image,
      price,
      totalTickets,
      ticketCategories,
      budget,
      termsAndConditions,
      venuePermissionUrl,
      licenseDetails,
      ownershipProofUrl,
      eventDocuments,
      onGroundContactName,
      onGroundContactPhone,
      crowdManagementPlan,
      gateInstructions,
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

    const normalizedTicketCategories = normalizeTicketCategories(ticketCategories, price || 0, totalTickets || 100);
    const totalTicketCount = normalizedTicketCategories.reduce((sum, item) => sum + item.quantity, 0);
    const firstTicketCategory = normalizedTicketCategories.find((item) => item.isActive !== false) || normalizedTicketCategories[0];

    const event = new Event({
      title,
      description,
      date: eventDate,
      time,
      venue,
      location,
      category,
      eventType: eventType || 'Other',
      image: image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      price: firstTicketCategory?.price || price || 0,
      totalTickets: totalTicketCount,
      availableTickets: totalTicketCount,
      ticketCategories: normalizedTicketCategories,
      budget: Math.max(0, toNumber(budget, 0)),
      termsAndConditions,
      venuePermissionUrl,
      licenseDetails,
      ownershipProofUrl,
      eventDocuments: Array.isArray(eventDocuments) ? eventDocuments : [],
      onGroundContactName,
      onGroundContactPhone,
      crowdManagementPlan,
      gateInstructions,
      organizer: req.user.id,
      tags: tags || [],
      isActive: false,
      moderationStatus: 'pending',
      lifecycleStage: 'under_review',
      ticketSaleStatus: 'pending_approval'
    });

    await event.save();

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update event (Admin only)
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is organizer
    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
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
      'eventType',
      'image',
      'price',
      'totalTickets',
      'ticketCategories',
      'budget',
      'termsAndConditions',
      'venuePermissionUrl',
      'licenseDetails',
      'ownershipProofUrl',
      'eventDocuments',
      'onGroundContactName',
      'onGroundContactPhone',
      'crowdManagementPlan',
      'gateInstructions',
      'tags'
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (updates.date) updates.date = new Date(updates.date);
    if (updates.ticketCategories || updates.price !== undefined || updates.totalTickets !== undefined) {
      const normalizedTicketCategories = normalizeTicketCategories(
        updates.ticketCategories || event.ticketCategories,
        updates.price !== undefined ? updates.price : event.price,
        updates.totalTickets !== undefined ? updates.totalTickets : event.totalTickets
      );
      updates.ticketCategories = normalizedTicketCategories;
      updates.totalTickets = normalizedTicketCategories.reduce((sum, item) => sum + item.quantity, 0);
      updates.availableTickets = normalizedTicketCategories.reduce((sum, item) => sum + item.availableQuantity, 0);
      updates.price = normalizedTicketCategories.find((item) => item.isActive !== false)?.price || normalizedTicketCategories[0]?.price || 0;
    }

    if (event.moderationStatus === 'approved') {
      updates.moderationStatus = 'pending';
      updates.lifecycleStage = 'under_review';
      updates.ticketSaleStatus = 'pending_approval';
      updates.isActive = false;
      updates.moderationNotes = 'Organizer edited this event after approval. Review required before ticket sales resume.';
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json(updatedEvent);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete event (Admin only)
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is organizer
    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: 'Event removed' });
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
    const cityLocationQuery = buildCityLocationQuery(req.query.city);
    const cityFilter = cityLocationQuery ? { $and: [cityLocationQuery] } : {};
    const featuredEvents = await Event.find({ isActive: true, moderationStatus: 'approved', isFeatured: true, ...PUBLIC_SALES_QUERY, ...cityFilter })
      .sort({ date: 1 })
      .limit(6)
      .populate('organizer', 'name');

    if (featuredEvents.length >= 6) {
      return res.json(featuredEvents);
    }

    const fallbackEvents = await Event.find({
      isActive: true,
      moderationStatus: 'approved',
      ...PUBLIC_SALES_QUERY,
      ...cityFilter,
      _id: { $nin: featuredEvents.map((event) => event._id) }
    })
      .sort({ isTrending: -1, date: 1 })
      .limit(6 - featuredEvents.length)
      .populate('organizer', 'name');

    res.json([...featuredEvents, ...fallbackEvents]);
  } catch (error) {
    console.error('Get featured events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
