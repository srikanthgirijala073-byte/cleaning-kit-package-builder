const db = require('../config/db');

const OtpCode = {
  async create(userId, code, expiresAt) {
    // Delete any previous OTPs for this user
    await db.execute('DELETE FROM otp_codes WHERE user_id = ?', [userId]);
    await db.execute(
      'INSERT INTO otp_codes (user_id, code, expires_at) VALUES (?, ?, ?)',
      [userId, code, expiresAt]
    );
  },

  async findValidOtp(userId, code) {
    const [rows] = await db.execute(
      'SELECT * FROM otp_codes WHERE user_id = ? AND code = ? AND expires_at > NOW()',
      [userId, code]
    );
    return rows[0];
  },

  async deleteByUserId(userId) {
    await db.execute('DELETE FROM otp_codes WHERE user_id = ?', [userId]);
  }
};

module.exports = OtpCode;
