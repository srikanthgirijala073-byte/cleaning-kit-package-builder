const db = require('../config/db');

const LoginHistory = {
  async create({ userId, deviceName = '', browser = '', ipAddress = '', location = '' }) {
    const [result] = await db.execute(
      'INSERT INTO login_history (user_id, device_name, browser, ip_address, location) VALUES (?, ?, ?, ?, ?)',
      [userId, deviceName, browser, ipAddress, location]
    );
    return result.insertId;
  },

  async findByUserId(userId) {
    const [rows] = await db.execute('SELECT * FROM login_history WHERE user_id = ? ORDER BY login_date DESC LIMIT 50', [userId]);
    return rows;
  },

  async recordLogout(historyId) {
    await db.execute('UPDATE login_history SET logout_time = NOW() WHERE id = ?', [historyId]);
  }
};

module.exports = LoginHistory;
