/**
 * seedRbacOnStartup.js
 * ------------------------------------------------------------------
 * Seeds the MongoDB RBAC database with Manager and Staff accounts
 * whenever the backend server starts. This is critical when using
 * in-memory MongoDB (mongodb-memory-server), which loses all data
 * between restarts.
 *
 * Called from server.js after connectMongo() succeeds.
 * Idempotent — safe to run on every startup.
 */

const Manager = require('../models/Manager');
const Staff = require('../models/Staff');

const USERS = {
  manager: {
    name: 'Manager',
    email: 'kt493342@gmail.com',
    password: '789456',
    phone: '',
    status: 'active',
  },
  staff: {
    name: 'Jahnavi Sadhu',
    email: 'jahnavisadhu26@gmail.com',
    password: '741085',
    department: 'Operations',
    phone: '',
    status: 'active',
  },
};

async function seedRbacUsers() {
  // ---- Manager ------------------------------------------------------------
  const existingManager = await Manager.findOne({ email: USERS.manager.email });
  if (existingManager) {
    existingManager.password = USERS.manager.password;
    existingManager.status = USERS.manager.status;
    await existingManager.save();
    console.log(`RBAC seed: Manager updated (${USERS.manager.email})`);
  } else {
    await Manager.create(USERS.manager);
    console.log(`RBAC seed: Manager created (${USERS.manager.email})`);
  }

  // ---- Staff --------------------------------------------------------------
  const existingStaff = await Staff.findOne({ email: USERS.staff.email });
  if (existingStaff) {
    existingStaff.password = USERS.staff.password;
    existingStaff.status = USERS.staff.status;
    existingStaff.department = USERS.staff.department;
    await existingStaff.save();
    console.log(`RBAC seed: Staff updated (${USERS.staff.email})`);
  } else {
    await Staff.create(USERS.staff);
    console.log(`RBAC seed: Staff created (${USERS.staff.email})`);
  }

  const mgrCount = await Manager.countDocuments();
  const stfCount = await Staff.countDocuments();
  console.log(`RBAC seed complete — Managers: ${mgrCount}, Staff: ${stfCount}`);
}

module.exports = seedRbacUsers;
