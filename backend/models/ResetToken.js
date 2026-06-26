const db = require('../config/db');

const ResetToken = {
  async create(userId, token, expiresAt) {
    // Delete any existing reset tokens for this user first
    await db.execute('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId]);
    await db.execute(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [userId, token, expiresAt]
    );
  },

  async findByToken(token) {
    const [rows] = await db.execute('SELECT * FROM password_reset_tokens WHERE token = ?', [token]);
    return rows[0];
  },

  async deleteByToken(token) {
    await db.execute('DELETE FROM password_reset_tokens WHERE token = ?', [token]);
  }
};

module.exports = ResetToken;
