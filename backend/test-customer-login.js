const path = require('path');
const backendDir = 'c:/Users/SRIKANTH/Downloads/cleankit_FIXED/cleankit_fixed/backend';

// Load dotenv from backend node_modules
const dotenv = require(path.join(backendDir, 'node_modules/dotenv'));
dotenv.config({ path: path.join(backendDir, '.env') });

const db = require(path.join(backendDir, 'config/db'));

async function checkUser() {
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', ['sathyanarayanarao2020@gmail.com']);
    console.log("User record in DB:", rows[0]);
  } catch (e) {
    console.error("DB error:", e);
  }
  process.exit(0);
}

checkUser();
