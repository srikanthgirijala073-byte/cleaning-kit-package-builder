const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('.env file not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

console.log('Starting sequential Vercel environment configuration...');

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;

  const parts = trimmed.split('=');
  if (parts.length < 2) continue;

  const key = parts[0].trim();
  const value = parts.slice(1).join('=').trim();

  try {
    console.log(`Setting ${key} in production...`);
    // Remove if exists
    try {
      execSync(`npx vercel env rm ${key} production -y`, { stdio: 'ignore' });
    } catch (rmErr) {}
    // Add new value
    execSync(`npx vercel env add ${key} production --value "${value}"`, { stdio: 'inherit' });
    console.log(`✓ Successfully set ${key}`);
  } catch (err) {
    console.error(`✗ Failed to set ${key}:`, err.message);
  }
}

console.log('Triggering production redeployment...');
execSync('npx vercel --prod --yes', { stdio: 'inherit' });
console.log('Deployment complete!');
