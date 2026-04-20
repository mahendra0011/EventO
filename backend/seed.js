const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Event = require('./models/Event');
const Booking = require('./models/Booking');

// Sample data
const users = [
  {
    name: 'Admin User',
    email: 'admin@evento.com',
    password: 'admin123',
    role: 'admin',
    phone: '+1234567890',
    isVerified: true
  },
  {
    name: 'Mahendra Admin',
    email: 'mahendrapra0077@gmail.com',
    password: 'admin@123',
    role: 'admin',
    phone: '+1234567899',
    isVerified: true
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'user123',
    role: 'user',
    phone: '+1234567891',
    isVerified: true
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'user123',
    role: 'user',
    phone: '+1234567892',
    isVerified: true
  }
];

const events = [
  {
    title: 'Tech Conference 2024',
    description: 'Join us for the biggest tech conference of the year! Featuring keynotes from industry leaders, hands-on workshops, and networking opportunities. Learn about the latest trends in AI, cloud computing, and software development.',
    date: new Date('2024-06-15'),
    time: '09:00 AM',
    venue: 'Bangalore International Exhibition Centre',
    location: 'Bangalore, Karnataka',
    category: 'Technology',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    price: 499, // Reduced from 24999
    totalTickets: 500,
    tags: ['tech', 'conference', 'AI', 'networking']
  },
  {
    title: 'Summer Music Festival',
    description: 'Experience three days of incredible live music featuring top artists from around the world. Multiple stages, food vendors, and unforgettable performances await you at this annual summer celebration.',
    date: new Date('2024-07-20'),
    time: '02:00 PM',
    venue: 'Jawaharlal Nehru Stadium',
    location: 'New Delhi, Delhi',
    category: 'Music',
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800',
    price: 299, // Reduced from 12499
    totalTickets: 10000,
    tags: ['music', 'festival', 'summer', 'live']
  },
  {
    title: 'Business Leadership Summit',
    description: 'A premier gathering of business leaders and entrepreneurs. Gain insights from successful CEOs, learn innovative strategies, and connect with potential partners and investors.',
    date: new Date('2024-08-10'),
    time: '10:00 AM',
    venue: 'Taj Palace Hotel',
    location: 'Mumbai, Maharashtra',
    category: 'Business',
    image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800',
    price: 799, // Reduced from 41999
    totalTickets: 200,
    tags: ['business', 'leadership', 'networking', 'entrepreneurship']
  },
  {
    title: 'Marathon 2024',
    description: 'Challenge yourself in our annual city marathon! Whether you are a seasoned runner or a first-timer, join thousands of participants in this exciting race through scenic routes.',
    date: new Date('2024-09-05'),
    time: '06:00 AM',
    venue: 'Marine Drive',
    location: 'Mumbai, Maharashtra',
    category: 'Sports',
    image: 'https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=800',
    price: 149, // Reduced from 6249
    totalTickets: 5000,
    tags: ['sports', 'marathon', 'running', 'fitness']
  },
  {
    title: 'Art Exhibition: Modern Masters',
    description: 'Explore stunning works from contemporary artists around the world. This exclusive exhibition showcases paintings, sculptures, and digital art that push the boundaries of creativity.',
    date: new Date('2024-10-15'),
    time: '11:00 AM',
    venue: 'National Gallery of Modern Art',
    location: 'New Delhi, Delhi',
    category: 'Art',
    image: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800',
    price: 99, // Reduced from 2099
    totalTickets: 300,
    tags: ['art', 'exhibition', 'modern', 'culture']
  },
  {
    title: 'Food & Wine Festival',
    description: 'Indulge in a culinary adventure featuring gourmet dishes from top chefs and premium wines from renowned vineyards. Cooking demonstrations, tastings, and live entertainment included.',
    date: new Date('2024-11-20'),
    time: '05:00 PM',
    venue: 'ITC Grand Chola',
    location: 'Chennai, Tamil Nadu',
    category: 'Food',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    price: 199, // Reduced from 9999
    totalTickets: 800,
    tags: ['food', 'wine', 'culinary', 'festival']
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Event.deleteMany({});
    await Booking.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const createdUsers = await User.create(users);
    console.log(`Created ${createdUsers.length} users`);

    // Get admin user
    const adminUser = createdUsers.find(u => u.role === 'admin');

    // Create events with admin as organizer
    const eventsWithOrganizer = events.map(event => ({
      ...event,
      organizer: adminUser._id,
      availableTickets: event.totalTickets
    }));

    const createdEvents = await Event.create(eventsWithOrganizer);
    console.log(`Created ${createdEvents.length} events`);

    // Create some sample bookings
    const regularUsers = createdUsers.filter(u => u.role === 'user');
    const sampleBookings = [];

    for (const user of regularUsers) {
      // Each user books 2-3 events
      const eventsToBook = createdEvents.slice(0, 3);
      
      for (const event of eventsToBook) {
        const numberOfTickets = Math.floor(Math.random() * 3) + 1;
        const totalPrice = event.price * numberOfTickets;

        sampleBookings.push({
          user: user._id,
          event: event._id,
          numberOfTickets,
          totalPrice,
          status: 'confirmed',
          paymentStatus: 'completed',
          isOtpVerified: true,
          confirmedAt: new Date(),
          attendeeDetails: [{
            name: user.name,
            email: user.email,
            phone: user.phone
          }]
        });
      }
    }

    const createdBookings = await Booking.create(sampleBookings);
    console.log(`Created ${createdBookings.length} bookings`);

    // Update event available tickets
    for (const booking of createdBookings) {
      await Event.findByIdAndUpdate(booking.event, {
        $inc: { availableTickets: -booking.numberOfTickets }
      });
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📧 Sample credentials:');
    console.log('Admin: admin@evento.com / admin123');
    console.log('User: john@example.com / user123');
    console.log('User: jane@example.com / user123');
    console.log('\n💰 Ticket prices have been reduced for better accessibility!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
