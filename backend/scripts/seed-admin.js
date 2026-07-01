const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
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

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'mahendrapra0077@gmail.com').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || 'mahendra@123';
  const name = process.env.ADMIN_NAME || 'Mahendra Admin';

  if (!email || !password) {
    console.error('❌ Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env file.');
    process.exit(1);
  }

  try {
    const uri = await getMongoUri();
    await mongoose.connect(uri, await getMongoOptions());
    console.log(`✅ Connected to database: "${mongoose.connection.name}"\n`);

    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser.role === 'admin') {
      console.log(`⚠️  Admin user already exists: ${email}`);
      console.log('   Use ADMIN_RESET_PASSWORD=true to reset password.');
      await mongoose.disconnect();
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    if (existingUser) {
      existingUser.password = hashedPassword;
      existingUser.name = name;
      existingUser.role = 'admin';
      existingUser.isVerified = true;
      existingUser.isBlocked = false;
      await existingUser.save();

      console.log('🔄 Upgraded existing user to admin role.');
      console.log('   Name  :', name);
      console.log('   Email :', email);
      console.log('   Role  : admin');
    } else {
      await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'admin',
        isVerified: true,
        isBlocked: false
      });

      console.log('🎉 Admin user created successfully!');
      console.log('   Name  :', name);
      console.log('   Email :', email);
      console.log('   Role  : admin');
    }

    console.log('\n✅ Admin seeding complete.\n');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedAdmin();