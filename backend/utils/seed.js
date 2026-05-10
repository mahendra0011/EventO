const User = require('../models/User');
const Category = require('../models/Category');

const DEFAULT_CATEGORIES = [
  'Music',
  'Sports',
  'Technology',
  'Food',
  'Gaming',
  'Business',
  'Workshops',
  'Art',
  'Other'
];

const seedDefaultCategories = async () => {
  await Promise.all(DEFAULT_CATEGORIES.map((name) => Category.updateOne(
    { name },
    { $setOnInsert: { name, isActive: true } },
    { upsert: true }
  )));
};

const seedAdminUser = async () => {
  const email = (process.env.ADMIN_EMAIL || 'mahendrapra0077@gmail.com').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || 'mahendra@123';
  const name = process.env.ADMIN_NAME || 'Mahendra Admin';

  if (!email || !password) {
    console.warn('[Seed] ADMIN_EMAIL or ADMIN_PASSWORD is missing. Admin seed skipped.');
    return;
  }

  const existingUser = await User.findOne({ email });

  if (!existingUser) {
    await User.create({
      name,
      email,
      password,
      role: 'admin',
      isVerified: true,
      isBlocked: false
    });
    console.log(`[Seed] Admin user created: ${email}`);
    return;
  }

  const wasAdmin = existingUser.role === 'admin';
  existingUser.name = existingUser.name || name;
  existingUser.role = 'admin';
  existingUser.isVerified = true;
  existingUser.isBlocked = false;

  if (!wasAdmin || process.env.ADMIN_RESET_PASSWORD === 'true') {
    existingUser.password = password;
  }

  await existingUser.save();
  console.log(`[Seed] Admin user ready: ${email}`);
};

module.exports = {
  seedAdminUser,
  seedDefaultCategories
};
