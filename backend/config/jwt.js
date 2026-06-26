require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'cleaning_kit_builder_jwt_secret_key_2026',
  expiresIn: process.env.JWT_EXPIRE || '7d',
};
