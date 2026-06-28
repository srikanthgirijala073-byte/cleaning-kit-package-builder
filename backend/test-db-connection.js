const { pool, testConnection } = require('./config/db');
const { connectMongo, mongoose } = require('./config/mongodb');
require('dotenv').config();

async function runDiagnostics() {
  console.log('==================================================');
  console.log('🔍 RUNNING DATABASE DIAGNOSTICS');
  console.log('==================================================\n');

  // 1. Test MySQL Connection
  console.log('⏳ 1. Testing MySQL connection...');
  const mysqlConnected = await testConnection();
  if (mysqlConnected) {
    console.log('✅ MySQL is connected!');
    try {
      // Query users count
      const [rows] = await pool.query('SELECT role, count(*) as count FROM users GROUP BY role');
      console.log('📊 MySQL User Accounts by Role:');
      rows.forEach(r => {
        console.log(`   - ${r.role}: ${r.count} users`);
      });

      // Check if admin is present
      const [admins] = await pool.query('SELECT email FROM users WHERE role = "admin"');
      if (admins.length > 0) {
        console.log(`🔑 MySQL Admins registered: ${admins.map(a => a.email).join(', ')}`);
      } else {
        console.log('⚠️ Warning: No Admin accounts found in MySQL. You should register or seed one.');
      }
    } catch (err) {
      console.error('❌ Failed to query MySQL users table:', err.message);
    }
  } else {
    console.error('❌ MySQL connection failed. Please ensure MySQL is running on port 3306 and check your DB_PASSWORD in backend/.env.');
  }

  console.log('\n--------------------------------------------------\n');

  // 2. Test MongoDB Connection
  console.log('⏳ 2. Testing MongoDB connection...');
  const mongoConnected = await connectMongo();
  if (mongoConnected) {
    console.log('✅ MongoDB is connected!');
    try {
      // Check if Admin/Manager/Staff exist in MongoDB
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      const hasUsers = collections.some(c => c.name === 'rbac_users' || c.name === 'users');
      if (hasUsers) {
        // Query some RBAC users
        const usersCollection = db.collection('rbac_users');
        const rbacUsers = await usersCollection.find({}).toArray();
        console.log(`📊 MongoDB (RBAC) Accounts found: ${rbacUsers.length}`);
        rbacUsers.forEach(u => {
          console.log(`   - ${u.role}: ${u.email}`);
        });
      } else {
        console.log('⚠️ Warning: No RBAC users found in MongoDB. They will be seeded when you start the server using "npm run dev" or "node server.js".');
      }
    } catch (err) {
      console.error('❌ Failed to query MongoDB:', err.message);
    } finally {
      await mongoose.disconnect();
    }
  } else {
    console.error('❌ MongoDB connection failed.');
  }

  console.log('\n==================================================');
  console.log('🔍 DIAGNOSTICS COMPLETE');
  console.log('==================================================');
  
  // Close MySQL pool
  await pool.end();
}

runDiagnostics().catch(err => {
  console.error('Fatal diagnostic error:', err);
});
