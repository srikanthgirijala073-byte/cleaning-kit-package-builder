/**
 * seedRbac.js
 * ------------------------------------------------------------------
 * Seeds the MongoDB RBAC database with the Manager and Staff accounts
 * so the role-based login flow works immediately.
 *
 * Usage:
 *   node scripts/seedRbac.js
 *
 * It first connects to MongoDB (with the same in-memory fallback
 * used by the main server), upserts the two accounts, and then
 * disconnects. It is safe to run multiple times (idempotent).
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Manager = require('../models/Manager');
const Staff = require('../models/Staff');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cleaning_kit_rbac';

async function seed() {
  console.log('Connecting to MongoDB (RBAC)…');

  let usingInMemory = false;
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
    console.log(`Connected to MongoDB at ${MONGO_URI}`);
  } catch (err) {
    console.warn('MongoDB not reachable, starting in-memory server…');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    usingInMemory = true;
    console.log(`Connected to in-memory MongoDB at ${uri}`);
  }

  // ---- Manager ------------------------------------------------------------
  const managerEmail = 'kt493342@gmail.com';
  const managerData = {
    name: 'Manager',
    email: managerEmail,
    password: '789456',
    phone: '',
    status: 'active',
  };

  const existingManager = await Manager.findOne({ email: managerEmail });
  if (existingManager) {
    console.log(`Manager already exists (${managerEmail}), updating…`);
    existingManager.password = '789456';
    existingManager.status = 'active';
    await existingManager.save();
  } else {
    await Manager.create(managerData);
    console.log(`Manager created (${managerEmail})`);
  }

  // ---- Staff --------------------------------------------------------------
  const staffEmail = 'jahnavisadhu26@gmail.com';
  const staffData = {
    name: 'Jahnavi Sadhu',
    email: staffEmail,
    password: '741085',
    department: 'Operations',
    phone: '',
    status: 'active',
  };

  const existingStaff = await Staff.findOne({ email: staffEmail });
  if (existingStaff) {
    console.log(`Staff already exists (${staffEmail}), updating…`);
    existingStaff.password = '741085';
    existingStaff.status = 'active';
    await existingStaff.save();
  } else {
    await Staff.create(staffData);
    console.log(`Staff created (${staffEmail})`);
  }

  // ---- Verify -------------------------------------------------------------
  const managers = await Manager.find().select('-password');
  const staff = await Staff.find().select('-password');
  console.log(`\n✅ Seeding complete.`);
  console.log(`   Managers: ${managers.length}`);
  console.log(`   Staff:    ${staff.length}`);

  if (usingInMemory) {
    console.log('\n⚠️  Using in-memory MongoDB. Data will be lost on server restart.');
    console.log('   The backend server will also use in-memory MongoDB automatically.');
    console.log('   For persistent storage, install MongoDB locally.');
  }

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
