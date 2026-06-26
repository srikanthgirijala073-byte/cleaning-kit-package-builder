const db = require('../config/db');

const Session = {
  async create({ userId, refreshToken, deviceName = '', browser = '', ipAddress = '', expiresAt }) {
    await db.execute(
      'INSERT INTO user_sessions (user_id, refresh_token, device_name, browser, ip_address, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, refreshToken, deviceName, browser, ipAddress, expiresAt]
    );
  },

  async findByToken(refreshToken) {
    const [rows] = await db.execute('SELECT * FROM user_sessions WHERE refresh_token = ?', [refreshToken]);
    return rows[0];
  },

  async deleteByToken(refreshToken) {
    await db.execute('DELETE FROM user_sessions WHERE refresh_token = ?', [refreshToken]);
  },

  async deleteByUserId(userId) {
    await db.execute('DELETE FROM user_sessions WHERE user_id = ?', [userId]);
  },

  async findByUserId(userId) {
    const [rows] = await db.execute('SELECT id, device_name, browser, ip_address, created_at, expires_at FROM user_sessions WHERE user_id = ?', [userId]);
    return rows;
  },

  async deleteOtherSessions(userId, currentRefreshToken) {
    await db.execute('DELETE FROM user_sessions WHERE user_id = ? AND refresh_token != ?', [userId, currentRefreshToken]);
  }
};

module.exports = Session;
