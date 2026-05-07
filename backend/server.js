const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

mongoose.set('bufferCommands', false);

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');
const hostRoutes = require('./routes/host');
const wishlistRoutes = require('./routes/wishlist');
const reviewRoutes = require('./routes/reviews');
const notificationRoutes = require('./routes/notifications');
const messageRoutes = require('./routes/messages');

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const corsOptions = {
  origin: FRONTEND_URL,
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/host', hostRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Evento API is running' });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/evento';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
    
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
    return server;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

startServer();

module.exports = app;
