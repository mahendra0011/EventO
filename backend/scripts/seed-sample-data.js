const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

mongoose.set('bufferCommands', false);

const ActivityLog = require('../models/ActivityLog');
const Booking = require('../models/Booking');
const Category = require('../models/Category');
const Event = require('../models/Event');
const Location = require('../models/Location');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Review = require('../models/Review');
const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');
const Wishlist = require('../models/Wishlist');

const SEED_TAG = 'evento-seed';
const SEED_BOOKING_NOTE = 'Seed data booking';
const SEED_LINK_PREFIX = '/seed-data';

const args = process.argv.slice(2);

function hasFlag(name) {
  return args.includes(`--${name}`);
}

function getMongoUri() {
  return process.env.MONGODB_URI || 'mongodb://localhost:27017/evento';
}

function getMongoOptions() {
  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10
  };

  if (process.env.MONGODB_DB_NAME) {
    options.dbName = process.env.MONGODB_DB_NAME;
  }

  return options;
}

function daysFromNow(days, hour = 10, minute = 0) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

const categories = [
  { name: 'Music', description: 'Concerts, festivals, DJ nights, and live performances.' },
  { name: 'Sports', description: 'Races, tournaments, fitness events, and fan experiences.' },
  { name: 'Technology', description: 'Conferences, product meetups, hackathons, and workshops.' },
  { name: 'Food', description: 'Food festivals, chef tables, tastings, and culinary pop-ups.' },
  { name: 'Gaming', description: 'Esports, LAN parties, tournaments, and community game nights.' },
  { name: 'Business', description: 'Summits, networking sessions, expos, and startup events.' },
  { name: 'Workshops', description: 'Hands-on learning sessions and professional skill labs.' },
  { name: 'Art', description: 'Exhibitions, gallery nights, design shows, and cultural events.' },
  { name: 'Other', description: 'Community events that do not fit another category.' }
];

const users = [
  {
    name: 'Evento Admin',
    email: 'admin@evento.com',
    password: 'admin123',
    role: 'admin',
    phone: '+91 90000 10001',
    secretKeyword: 'admin-demo'
  },
  {
    name: 'Aarav Mehta',
    email: 'host@evento.com',
    password: 'host123',
    role: 'host',
    phone: '+91 90000 10002',
    secretKeyword: 'host-demo',
    organizerDocuments: [
      {
        label: 'Organizer GST Certificate',
        url: 'https://example.com/demo/organizer-gst.pdf',
        status: 'approved',
        uploadedAt: daysFromNow(-12)
      }
    ]
  },
  {
    name: 'Riya Kapoor',
    email: 'music.host@evento.com',
    password: 'host123',
    role: 'host',
    phone: '+91 90000 10003',
    secretKeyword: 'music-demo',
    organizerDocuments: [
      {
        label: 'Venue Partner Agreement',
        url: 'https://example.com/demo/venue-agreement.pdf',
        status: 'approved',
        uploadedAt: daysFromNow(-10)
      }
    ]
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'user123',
    role: 'user',
    phone: '+91 90000 10004',
    secretKeyword: 'john-demo'
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'user123',
    role: 'user',
    phone: '+91 90000 10005',
    secretKeyword: 'jane-demo'
  },
  {
    name: 'Alex Fernandes',
    email: 'alex@example.com',
    password: 'user123',
    role: 'user',
    phone: '+91 90000 10006',
    secretKeyword: 'alex-demo'
  }
];

const locations = [
  { city: 'Bengaluru', region: 'Karnataka', country: 'India', notes: 'Technology and startup events.' },
  { city: 'Mumbai', region: 'Maharashtra', country: 'India', notes: 'Business, food, art, and sports events.' },
  { city: 'New Delhi', region: 'Delhi', country: 'India', notes: 'Large festivals, expos, and conferences.' },
  { city: 'Hyderabad', region: 'Telangana', country: 'India', notes: 'Gaming, tech, and food communities.' },
  { city: 'Pune', region: 'Maharashtra', country: 'India', notes: 'Workshops, colleges, and community meetups.' }
];

const events = [
  {
    title: 'AI Product Summit 2026',
    description: 'A full-day summit for builders, founders, and product teams exploring practical AI workflows, model evaluation, and launch playbooks.',
    date: daysFromNow(18, 9, 30),
    time: '09:30 AM',
    venue: 'Bangalore International Exhibition Centre',
    location: 'Bengaluru, Karnataka',
    category: 'Technology',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
    price: 799,
    totalTickets: 420,
    organizerEmail: 'host@evento.com',
    isFeatured: true,
    isTrending: true,
    moderationStatus: 'approved',
    tags: ['ai', 'product', 'conference', 'networking']
  },
  {
    title: 'Indie Beats Music Night',
    description: 'An open-air evening with indie bands, acoustic sets, curated food stalls, and a late-night DJ showcase.',
    date: daysFromNow(26, 18, 0),
    time: '06:00 PM',
    venue: 'JLN Stadium Grounds',
    location: 'New Delhi, Delhi',
    category: 'Music',
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200',
    price: 499,
    totalTickets: 1800,
    organizerEmail: 'music.host@evento.com',
    isFeatured: true,
    isTrending: true,
    moderationStatus: 'approved',
    tags: ['music', 'indie', 'live', 'festival']
  },
  {
    title: 'Founder Finance Bootcamp',
    description: 'A hands-on workshop for founders covering pricing, runway planning, investor updates, and finance dashboards.',
    date: daysFromNow(34, 11, 0),
    time: '11:00 AM',
    venue: 'WeWork Galaxy',
    location: 'Bengaluru, Karnataka',
    category: 'Business',
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200',
    price: 299,
    totalTickets: 160,
    organizerEmail: 'host@evento.com',
    isFeatured: false,
    isTrending: true,
    moderationStatus: 'approved',
    tags: ['startup', 'finance', 'bootcamp', 'founders']
  },
  {
    title: 'Mumbai Monsoon Marathon',
    description: 'A scenic 10K and half-marathon experience along Mumbai routes with hydration stations, pacers, and finisher medals.',
    date: daysFromNow(48, 6, 0),
    time: '06:00 AM',
    venue: 'Marine Drive',
    location: 'Mumbai, Maharashtra',
    category: 'Sports',
    image: 'https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=1200',
    price: 349,
    totalTickets: 2500,
    organizerEmail: 'host@evento.com',
    isFeatured: true,
    isTrending: false,
    moderationStatus: 'approved',
    tags: ['sports', 'running', 'marathon', 'fitness']
  },
  {
    title: 'Hyderabad Food Carnival',
    description: 'A weekend of regional dishes, chef counters, dessert bars, family activities, and live entertainment.',
    date: daysFromNow(61, 16, 30),
    time: '04:30 PM',
    venue: 'Hitex Exhibition Centre',
    location: 'Hyderabad, Telangana',
    category: 'Food',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200',
    price: 199,
    totalTickets: 1200,
    organizerEmail: 'music.host@evento.com',
    isFeatured: false,
    isTrending: true,
    moderationStatus: 'approved',
    tags: ['food', 'carnival', 'family', 'hyderabad']
  },
  {
    title: 'Modern Masters Gallery Walk',
    description: 'A guided evening through contemporary Indian art, installation work, and collector conversations.',
    date: daysFromNow(73, 17, 0),
    time: '05:00 PM',
    venue: 'National Gallery of Modern Art',
    location: 'Mumbai, Maharashtra',
    category: 'Art',
    image: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=1200',
    price: 149,
    totalTickets: 220,
    organizerEmail: 'host@evento.com',
    isFeatured: false,
    isTrending: false,
    moderationStatus: 'approved',
    tags: ['art', 'gallery', 'culture', 'walk']
  },
  {
    title: 'Pune Game Arena',
    description: 'A community esports day with team brackets, retro arcade corners, creator meetups, and casual play zones.',
    date: daysFromNow(82, 12, 0),
    time: '12:00 PM',
    venue: 'Balewadi High Street',
    location: 'Pune, Maharashtra',
    category: 'Gaming',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200',
    price: 249,
    totalTickets: 600,
    organizerEmail: 'music.host@evento.com',
    isFeatured: false,
    isTrending: true,
    moderationStatus: 'approved',
    tags: ['gaming', 'esports', 'community', 'tournament']
  },
  {
    title: 'Community Potluck Planning Meetup',
    description: 'A pending review example for admin moderation workflows, including notes and organizer follow-up.',
    date: daysFromNow(96, 15, 0),
    time: '03:00 PM',
    venue: 'Cubbon Park Bandstand',
    location: 'Bengaluru, Karnataka',
    category: 'Other',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200',
    price: 0,
    totalTickets: 80,
    organizerEmail: 'host@evento.com',
    isFeatured: false,
    isTrending: false,
    moderationStatus: 'pending',
    moderationNotes: 'Seed example pending admin review.',
    tags: ['community', 'meetup', 'planning']
  }
];

const bookingPlan = [
  {
    userEmail: 'john@example.com',
    eventTitle: 'AI Product Summit 2026',
    numberOfTickets: 2,
    status: 'confirmed',
    paymentStatus: 'completed'
  },
  {
    userEmail: 'jane@example.com',
    eventTitle: 'Indie Beats Music Night',
    numberOfTickets: 3,
    status: 'confirmed',
    paymentStatus: 'completed'
  },
  {
    userEmail: 'alex@example.com',
    eventTitle: 'Hyderabad Food Carnival',
    numberOfTickets: 4,
    status: 'pending',
    paymentStatus: 'pending'
  },
  {
    userEmail: 'john@example.com',
    eventTitle: 'Mumbai Monsoon Marathon',
    numberOfTickets: 1,
    status: 'confirmed',
    paymentStatus: 'completed',
    refundStatus: 'requested',
    refundReason: 'Schedule conflict after registration.'
  },
  {
    userEmail: 'jane@example.com',
    eventTitle: 'Founder Finance Bootcamp',
    numberOfTickets: 1,
    status: 'cancelled',
    paymentStatus: 'refunded',
    refundStatus: 'processed',
    refundReason: 'Duplicate booking.'
  },
  {
    userEmail: 'alex@example.com',
    eventTitle: 'Pune Game Arena',
    numberOfTickets: 2,
    status: 'confirmed',
    paymentStatus: 'completed',
    disputeStatus: 'open'
  }
];

const reviews = [
  {
    userEmail: 'john@example.com',
    eventTitle: 'AI Product Summit 2026',
    rating: 5,
    comment: 'Great speaker lineup and very practical sessions.'
  },
  {
    userEmail: 'jane@example.com',
    eventTitle: 'Indie Beats Music Night',
    rating: 4,
    comment: 'Loved the venue and the artist mix.'
  },
  {
    userEmail: 'alex@example.com',
    eventTitle: 'Pune Game Arena',
    rating: 5,
    comment: 'Smooth tournament flow and friendly community.'
  }
];

async function upsertUser(userData) {
  const email = userData.email.toLowerCase();
  let user = await User.findOne({ email });

  if (!user) {
    user = new User({ email });
  }

  user.name = userData.name;
  user.password = userData.password;
  user.role = userData.role;
  user.phone = userData.phone;
  user.secretKeyword = userData.secretKeyword;
  user.organizerDocuments = userData.organizerDocuments || [];
  user.isVerified = true;
  user.isBlocked = false;
  user.loginOtpVerified = false;

  await user.save();
  return user;
}

async function upsertCategories(adminUserId) {
  await Promise.all(categories.map((category) => Category.findOneAndUpdate(
    { name: category.name },
    {
      $set: {
        description: category.description,
        isActive: true,
        createdBy: adminUserId
      }
    },
    { upsert: true, new: true, runValidators: true }
  )));
}

async function upsertLocations(adminUserId) {
  await Promise.all(locations.map((location) => Location.findOneAndUpdate(
    {
      city: location.city,
      region: location.region,
      country: location.country
    },
    {
      $set: {
        notes: location.notes,
        isActive: true,
        createdBy: adminUserId
      }
    },
    { upsert: true, new: true, runValidators: true }
  )));
}

async function upsertEvent(eventData, usersByEmail) {
  let event = await Event.findOne({ title: eventData.title, tags: SEED_TAG });

  if (!event) {
    event = new Event({ title: eventData.title });
  }

  const organizer = usersByEmail.get(eventData.organizerEmail);
  event.title = eventData.title;
  event.description = eventData.description;
  event.date = eventData.date;
  event.time = eventData.time;
  event.venue = eventData.venue;
  event.location = eventData.location;
  event.category = eventData.category;
  event.image = eventData.image;
  event.price = eventData.price;
  event.totalTickets = eventData.totalTickets;
  event.availableTickets = eventData.totalTickets;
  event.organizer = organizer._id;
  event.isActive = true;
  event.isFeatured = eventData.isFeatured;
  event.isTrending = eventData.isTrending;
  event.moderationStatus = eventData.moderationStatus;
  event.moderationFlags = eventData.moderationFlags || [];
  event.moderationNotes = eventData.moderationNotes || '';
  event.tags = unique([...(eventData.tags || []), SEED_TAG]);

  await event.save();
  return event;
}

async function clearGeneratedData(seedUserIds, seedEventIds) {
  await Promise.all([
    Booking.deleteMany({ notes: new RegExp(`^${SEED_BOOKING_NOTE}`) }),
    Review.deleteMany({ user: { $in: seedUserIds }, event: { $in: seedEventIds } }),
    Wishlist.deleteMany({ user: { $in: seedUserIds }, event: { $in: seedEventIds } }),
    Message.deleteMany({ subject: /^Seed data:/ }),
    Notification.deleteMany({ link: new RegExp(`^${SEED_LINK_PREFIX}`) }),
    SupportTicket.deleteMany({ subject: /^Seed data:/ }),
    ActivityLog.deleteMany({ 'metadata.seed': true })
  ]);
}

async function createBookings(usersByEmail, eventsByTitle) {
  const createdBookings = [];

  for (const bookingData of bookingPlan) {
    const user = usersByEmail.get(bookingData.userEmail);
    const event = eventsByTitle.get(bookingData.eventTitle);
    const isConfirmed = bookingData.status === 'confirmed';
    const isCancelled = bookingData.status === 'cancelled';

    const booking = await Booking.create({
      user: user._id,
      event: event._id,
      numberOfTickets: bookingData.numberOfTickets,
      totalPrice: event.price * bookingData.numberOfTickets,
      status: bookingData.status,
      paymentStatus: bookingData.paymentStatus,
      refundStatus: bookingData.refundStatus || 'none',
      refundReason: bookingData.refundReason,
      disputeStatus: bookingData.disputeStatus || 'none',
      attendeeDetails: [
        {
          name: user.name,
          email: user.email,
          phone: user.phone
        }
      ],
      confirmedAt: isConfirmed ? daysFromNow(-2, 14, 0) : undefined,
      cancelledAt: isCancelled ? daysFromNow(-1, 12, 0) : undefined,
      notes: `${SEED_BOOKING_NOTE}: ${user.email} / ${event.title}`,
      isOtpVerified: isConfirmed,
      otp: bookingData.status === 'pending' ? '123456' : undefined,
      otpExpires: bookingData.status === 'pending' ? daysFromNow(1, 23, 59) : undefined,
      lastOtpSent: bookingData.status === 'pending' ? new Date() : undefined
    });

    createdBookings.push(booking);
  }

  return createdBookings;
}

async function refreshAvailableTickets(eventsByTitle) {
  for (const event of eventsByTitle.values()) {
    const [bookingTotals] = await Booking.aggregate([
      {
        $match: {
          event: event._id,
          status: 'confirmed'
        }
      },
      {
        $group: {
          _id: '$event',
          tickets: { $sum: '$numberOfTickets' }
        }
      }
    ]);

    event.availableTickets = Math.max(event.totalTickets - (bookingTotals?.tickets || 0), 0);
    await event.save();
  }
}

async function createReviews(usersByEmail, eventsByTitle) {
  return Promise.all(reviews.map((review) => Review.create({
    user: usersByEmail.get(review.userEmail)._id,
    event: eventsByTitle.get(review.eventTitle)._id,
    rating: review.rating,
    comment: review.comment
  })));
}

async function createWishlists(usersByEmail, eventsByTitle) {
  return Wishlist.insertMany([
    {
      user: usersByEmail.get('john@example.com')._id,
      event: eventsByTitle.get('Indie Beats Music Night')._id
    },
    {
      user: usersByEmail.get('jane@example.com')._id,
      event: eventsByTitle.get('AI Product Summit 2026')._id
    },
    {
      user: usersByEmail.get('alex@example.com')._id,
      event: eventsByTitle.get('Modern Masters Gallery Walk')._id
    }
  ]);
}

async function createNotifications(usersByEmail, eventsByTitle) {
  const notifications = [
    {
      user: usersByEmail.get('john@example.com')._id,
      title: 'Booking Confirmed',
      message: 'Your booking for "AI Product Summit 2026" is confirmed.',
      type: 'booking',
      link: `${SEED_LINK_PREFIX}/bookings`
    },
    {
      user: usersByEmail.get('jane@example.com')._id,
      title: 'Trending Event',
      message: '"Indie Beats Music Night" is trending this week.',
      type: 'promotion',
      link: `${SEED_LINK_PREFIX}/events/${eventsByTitle.get('Indie Beats Music Night')._id}`
    },
    {
      user: usersByEmail.get('host@evento.com')._id,
      title: 'New Booking Activity',
      message: 'Seed users have created new bookings for your events.',
      type: 'event',
      link: `${SEED_LINK_PREFIX}/host/bookings`
    },
    {
      user: usersByEmail.get('admin@evento.com')._id,
      title: 'Moderation Queue',
      message: 'A sample pending event is ready for admin review.',
      type: 'system',
      link: `${SEED_LINK_PREFIX}/admin/events`
    }
  ];

  return Notification.insertMany(notifications);
}

async function createMessages(usersByEmail, eventsByTitle, bookings) {
  const john = usersByEmail.get('john@example.com');
  const jane = usersByEmail.get('jane@example.com');
  const host = usersByEmail.get('host@evento.com');
  const musicHost = usersByEmail.get('music.host@evento.com');
  const aiEvent = eventsByTitle.get('AI Product Summit 2026');
  const musicEvent = eventsByTitle.get('Indie Beats Music Night');
  const johnBooking = bookings.find((booking) => booking.user.equals(john._id) && booking.event.equals(aiEvent._id));

  return Message.insertMany([
    {
      sender: john._id,
      receiver: host._id,
      event: aiEvent._id,
      booking: johnBooking?._id,
      subject: 'Seed data: Seating question',
      content: 'Can I choose seats near the workshop hall for the AI summit?',
      isRead: false
    },
    {
      sender: host._id,
      receiver: john._id,
      event: aiEvent._id,
      booking: johnBooking?._id,
      subject: 'Seed data: Seating question',
      content: 'Yes, the check-in desk can help you with workshop-hall seating.',
      isRead: true,
      readAt: new Date()
    },
    {
      sender: jane._id,
      receiver: musicHost._id,
      event: musicEvent._id,
      subject: 'Seed data: Group entry',
      content: 'Do all ticket holders need to arrive together for group entry?',
      isPublic: true,
      isRead: false
    }
  ]);
}

async function createSupportTickets(usersByEmail, eventsByTitle, bookings) {
  const john = usersByEmail.get('john@example.com');
  const jane = usersByEmail.get('jane@example.com');
  const admin = usersByEmail.get('admin@evento.com');
  const marathon = eventsByTitle.get('Mumbai Monsoon Marathon');
  const bootcamp = eventsByTitle.get('Founder Finance Bootcamp');
  const johnRefundBooking = bookings.find((booking) => booking.user.equals(john._id) && booking.event.equals(marathon._id));
  const janeCancelledBooking = bookings.find((booking) => booking.user.equals(jane._id) && booking.event.equals(bootcamp._id));

  return SupportTicket.insertMany([
    {
      user: john._id,
      event: marathon._id,
      booking: johnRefundBooking?._id,
      type: 'refund_issue',
      subject: 'Seed data: Refund request',
      message: 'I need help tracking a refund request for my marathon booking.',
      priority: 'high',
      status: 'open',
      createdBy: john._id
    },
    {
      user: jane._id,
      event: bootcamp._id,
      booking: janeCancelledBooking?._id,
      type: 'payment_dispute',
      subject: 'Seed data: Duplicate charge',
      message: 'This sample ticket shows how a resolved payment dispute appears.',
      priority: 'medium',
      status: 'resolved',
      resolution: 'Refund processed to the original payment method.',
      assignedTo: admin._id,
      createdBy: jane._id,
      resolvedAt: new Date()
    }
  ]);
}

async function createActivityLogs(usersByEmail, eventsByTitle) {
  const admin = usersByEmail.get('admin@evento.com');
  const pendingEvent = eventsByTitle.get('Community Potluck Planning Meetup');

  return ActivityLog.insertMany([
    {
      actor: admin._id,
      action: 'seed_data_created',
      entity: 'Event',
      entityId: pendingEvent._id,
      message: 'Sample pending event created for moderation testing.',
      metadata: { seed: true, tag: SEED_TAG }
    },
    {
      actor: admin._id,
      action: 'seed_data_refreshed',
      entity: 'Database',
      message: 'Sample Evento dataset refreshed.',
      metadata: { seed: true, tag: SEED_TAG }
    }
  ]);
}

async function seedDatabase() {
  if (process.env.NODE_ENV === 'production' && !hasFlag('allow-production')) {
    throw new Error('Refusing to seed while NODE_ENV=production without --allow-production.');
  }

  const uri = getMongoUri();
  await mongoose.connect(uri, getMongoOptions());
  console.log(`Connected to MongoDB database "${mongoose.connection.name}"`);

  const usersByEmail = new Map();
  for (const userData of users) {
    const user = await upsertUser(userData);
    usersByEmail.set(user.email, user);
  }

  const admin = usersByEmail.get('admin@evento.com');
  await upsertCategories(admin._id);
  await upsertLocations(admin._id);

  const eventsByTitle = new Map();
  for (const eventData of events) {
    const event = await upsertEvent(eventData, usersByEmail);
    eventsByTitle.set(event.title, event);
  }

  await clearGeneratedData(
    [...usersByEmail.values()].map((user) => user._id),
    [...eventsByTitle.values()].map((event) => event._id)
  );

  const bookings = await createBookings(usersByEmail, eventsByTitle);
  await refreshAvailableTickets(eventsByTitle);
  await createReviews(usersByEmail, eventsByTitle);
  await createWishlists(usersByEmail, eventsByTitle);
  await createNotifications(usersByEmail, eventsByTitle);
  await createMessages(usersByEmail, eventsByTitle, bookings);
  await createSupportTickets(usersByEmail, eventsByTitle, bookings);
  await createActivityLogs(usersByEmail, eventsByTitle);

  console.log('Sample data seeded successfully.');
  console.log(`Users: ${usersByEmail.size}`);
  console.log(`Events: ${eventsByTitle.size}`);
  console.log(`Bookings: ${bookings.length}`);
  console.log('Sample logins:');
  console.log('  Admin: admin@evento.com / admin123');
  console.log('  Host: host@evento.com / host123');
  console.log('  User: john@example.com / user123');
}

seedDatabase()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
