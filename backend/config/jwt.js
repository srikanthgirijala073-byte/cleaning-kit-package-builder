require('dotenv').config();

// Use the same secret as tokens.js so both sign/verify with the same key
const secret = process.env.JWT_SECRET || 'cleaning_kit_jwt_secret_key_2026_change_in_production';

module.exports = {
  secret,
  expiresIn: process.env.JWT_EXPIRE || '7d',
};
