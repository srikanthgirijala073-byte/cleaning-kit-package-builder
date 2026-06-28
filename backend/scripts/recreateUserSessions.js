const path = require('path');
const backendDir = 'c:/Users/SRIKANTH/Downloads/cleankit_FIXED/cleankit_fixed/backend';

// Load dotenv from backend node_modules
const dotenv = require(path.join(backendDir, 'node_modules/dotenv'));
dotenv.config({ path: path.join(backendDir, '.env') });

const db = require(path.join(backendDir, 'config/db'));

async function run() {
  console.log("Dropping and recreating 'user_sessions' table to match correct schema...");
  try {
    // 1. Drop existing table
    await db.execute("DROP TABLE IF EXISTS user_sessions");
    console.log("- Dropped old user_sessions table.");

    // 2. Create new table
    await db.execute(`
      CREATE TABLE user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        refresh_token VARCHAR(500) NOT NULL UNIQUE,
        device_name VARCHAR(100) DEFAULT '',
        browser VARCHAR(100) DEFAULT '',
        ip_address VARCHAR(45) DEFAULT '',
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_refresh (refresh_token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("- Created new user_sessions table successfully.");
  } catch (e) {
    console.error("Failed to recreate table:", e);
  }
  process.exit(0);
}

run();
