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

console.log('Adding environment variables to Vercel...');

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;

  const parts = trimmed.split('=');
  if (parts.length < 2) continue;

  const key = parts[0].trim();
  const value = parts.slice(1).join('=').trim();

  try {
    console.log(`Adding ${key}...`);
    // Vercel CLI syntax: vercel env add [name] [value] [environment]
    // We add to production, preview, and development
    execSync(`npx vercel env rm ${key} production -y`, { stdio: 'ignore' });
    execSync(`npx vercel env rm ${key} preview -y`, { stdio: 'ignore' });
    execSync(`npx vercel env rm ${key} development -y`, { stdio: 'ignore' });
    
    execSync(`npx vercel env add ${key} "${value}" production,preview,development`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Failed to add ${key}:`, err.message);
  }
}

console.log('Redeploying to apply environment variables...');
execSync('npx vercel --prod --yes', { stdio: 'inherit' });
console.log('Done!');
