const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
mongoose.set('bufferCommands', false);

const OLD_URI = 'mongodb+srv://mahendrapi0053_db_user:w546hI2x3pqv6AwU@cluster0.avvnhcg.mongodb.net/evento?retryWrites=true&w=majority';
const NEW_URI = 'mongodb+srv://mahendrapra0077:3Bkvlwlj1aZqi8VP@cluster0.5l9k4vd.mongodb.net/evento?retryWrites=true&w=majority';

const COLLECTIONS = [
  'users', 'events', 'bookings', 'categories', 'locations',
  'messages', 'reviews', 'activitylogs', 'notifications',
  'wishlists', 'supporttickets'
];

async function migrate() {
  console.log('Connecting to OLD cluster...');
  const oldConn = await mongoose.createConnection(OLD_URI, { serverSelectionTimeoutMS: 30000 }).asPromise();
  console.log('✅ Old cluster connected:', oldConn.name);

  console.log('Connecting to NEW cluster...');
  const newConn = await mongoose.createConnection(NEW_URI, { serverSelectionTimeoutMS: 30000 }).asPromise();
  console.log('✅ New cluster connected:', newConn.name);

  for (const colName of COLLECTIONS) {
    try {
      const oldCol = oldConn.db.collection(colName);
      const newCol = newConn.db.collection(colName);

      const docs = await oldCol.find({}).toArray();
      if (docs.length === 0) {
        console.log(`  ${colName}: 0 docs (skipping)`);
        continue;
      }

      // Clear existing data in new cluster for this collection
      await newCol.deleteMany({});

      // Insert in batches of 100
      for (let i = 0; i < docs.length; i += 100) {
        const batch = docs.slice(i, i + 100);
        await newCol.insertMany(batch);
      }

      console.log(`  ${colName}: ${docs.length} docs migrated ✅`);
    } catch (err) {
      console.log(`  ${colName}: ERROR - ${err.message}`);
    }
  }

  await oldConn.close();
  await newConn.close();
  console.log('\n🎉 Migration complete!');
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});