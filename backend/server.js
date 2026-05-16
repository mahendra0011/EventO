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
const adminRoutes = require('./routes/admin');
const supportRoutes = require('./routes/support');
const { getEmailDiagnostics, sendEmailDiagnostics } = require('./utils/email');
const { seedAdminUser, seedDefaultCategories } = require('./utils/seed');

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const NODE_ENV = process.env.NODE_ENV || 'development';
const REQUIRED_PRODUCTION_ENV_VARS = ['MONGODB_URI', 'JWT_SECRET', 'BREVO_API_KEY', 'FROM_EMAIL'];

const corsOptions = {
  origin: NODE_ENV === 'production' ? true : FRONTEND_URL,
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '15mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/host', hostRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Evento API is running' });
});

app.get('/api/health/email', async (req, res) => {
  const diagnostics = getEmailDiagnostics();

  if (req.query.send !== 'true') {
    return res.json({
      status: diagnostics.configured ? 'configured' : 'missing_config',
      diagnostics
    });
  }

  const result = await sendEmailDiagnostics();
  res.status(result.success ? 200 : 502).json({
    status: result.success ? 'sent' : 'failed',
    diagnostics,
    result: {
      success: result.success,
      accepted: result.accepted,
      rejected: result.rejected,
      messageId: result.messageId,
      error: result.error || result.message
    }
  });
});

if (NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'frontend', 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || '';

function validateProductionConfig() {
  if (NODE_ENV !== 'production') {
    return;
  }

  const missingEnvVars = REQUIRED_PRODUCTION_ENV_VARS.filter((key) => !process.env[key]);

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required production environment variable(s): ${missingEnvVars.join(', ')}. ` +
      'Set them in the Render service environment before deploying.'
    );
  }
}

function getMongoUri() {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  return 'mongodb://localhost:27017/evento';
}

function getMongoOptions() {
  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10
  };

  if (MONGODB_DB_NAME) {
    options.dbName = MONGODB_DB_NAME;
  }

  return options;
}

async function startServer() {
  try {
    validateProductionConfig();

    const mongoUri = getMongoUri();
    await mongoose.connect(mongoUri, getMongoOptions());
    console.log(`MongoDB connected successfully to database "${mongoose.connection.name}"`);
    await seedDefaultCategories();
    await seedAdminUser();
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT} in ${NODE_ENV} mode`);
    });
    return server;
  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

startServer();

module.exports = app;
