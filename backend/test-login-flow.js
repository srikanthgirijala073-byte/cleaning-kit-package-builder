const path = require('path');
const backendDir = 'c:/Users/SRIKANTH/Downloads/cleankit_FIXED/cleankit_fixed/backend';

// Load dotenv from backend node_modules
const dotenv = require(path.join(backendDir, 'node_modules/dotenv'));
dotenv.config({ path: path.join(backendDir, '.env') });

async function run() {
  const email = 'testuser1@example.com';
  const password = 'Password123';

  try {
    console.log("Sending login request for testuser1 via fetch...");
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    console.log("Login Status:", loginRes.status);
    const data = await loginRes.json();
    console.log("Login Response Data:", data);

  } catch (e) {
    console.error("Test error:", e);
  }
  process.exit(0);
}

run();
