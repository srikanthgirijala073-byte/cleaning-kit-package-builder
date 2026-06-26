const db = require('../config/db');

const VerificationToken = {
  async create(userId, token, expiresAt) {
    await db.execute(
      'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [userId, token, expiresAt]
    );
  },

  async findByToken(token) {
    const [rows] = await db.execute('SELECT * FROM email_verification_tokens WHERE token = ?', [token]);
    return rows[0];
  },

  async deleteByUserId(userId) {
    await db.execute('DELETE FROM email_verification_tokens WHERE user_id = ?', [userId]);
  },

  async deleteByToken(token) {
    await db.execute('DELETE FROM email_verification_tokens WHERE token = ?', [token]);
  }
};

module.exports = VerificationToken;
