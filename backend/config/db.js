const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cleaning_kit_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully!');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
};

// Helper: execute a query with parameters
const query = async (sql, params) => {
  const [results] = await pool.query(sql, params);
  return results;
};

// Helper: get a single row
const getOne = async (sql, params) => {
  const results = await query(sql, params);
  return results.length > 0 ? results[0] : null;
};

// Helper: prepared-statement execute, mirrors mysql2 pool.execute()
// NOTE: Several model files (Customer.js, Product.js, Order.js, AuditLog.js,
// User.js, etc.) call `db.execute(...)` directly and destructure the result
// as `const [rows] = await db.execute(...)`. Prior to this fix, `execute`
// was never exposed on the exports object, so every one of those models
// threw "db.execute is not a function" the moment they were called. This
// delegates straight to the underlying mysql2 pool so those models work
// exactly the way they were written, with no call-site changes needed.
const execute = async (sql, params) => {
  return pool.execute(sql, params);
};

module.exports = { pool, query, getOne, execute, testConnection };
