const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

async function addAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'mahendrapra0077@gmail.com' });
    if (existingAdmin) {
      console.log('Admin user already exists with that email');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      process.exit(0);
    }

    // Create new admin user
    const adminUser = new User({
      name: 'Mahendra Admin',
      email: 'mahendrapra0077@gmail.com',
      password: 'admin@123',
      role: 'admin',
      phone: '+1234567899',
      isVerified: true
    });

    await adminUser.save();
    console.log('✅ New admin user created successfully!');
    console.log('\n📧 Admin credentials:');
    console.log('Email: mahendrapra0077@gmail.com');
    console.log('Password: admin@123');
    console.log('Role: admin');
    console.log('\n🔑 Admin secret keyword for quick login: evento2580');

    process.exit(0);
  } catch (error) {
    console.error('Error adding admin user:', error);
    process.exit(1);
  }
}

addAdminUser();
