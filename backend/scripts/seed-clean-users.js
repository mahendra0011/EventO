const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const User = require('../models/User');

mongoose.set('bufferCommands', false);

async function getMongoUri() {
  return process.env.MONGODB_URI || 'mongodb://localhost:27017/evento';
}

async function getMongoOptions() {
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

async function cleanAndSeedUsers() {
  try {
    const uri = await getMongoUri();
    await mongoose.connect(uri, await getMongoOptions());
    console.log(`Connected to database: "${mongoose.connection.name}"\n`);

    // Delete all existing users except the one we want to keep
    const preserveEmails = [
      (process.env.ADMIN_EMAIL || 'mahendrapra0077@gmail.com').toLowerCase().trim()
    ];

    console.log('Deleting all other users...');
    const deleteResult = await User.deleteMany({ email: { $nin: preserveEmails } });
    console.log(`Deleted ${deleteResult.deletedCount} users.\n`);
    console.log('Remaining user(s):');
    const remaining = await User.find({ email: { $in: preserveEmails } });
    remaining.forEach((u) => console.log(` - ${u.email} (${u.role})`));
    console.log('');

    await mongoose.disconnect();
    console.log('Done. Users are now clean.');
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

cleanAndSeedUsers();