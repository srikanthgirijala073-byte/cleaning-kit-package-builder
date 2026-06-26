const db = require('../config/db');

const Settings = {
  async get() {
    const [rows] = await db.execute('SELECT * FROM settings WHERE id = 1');
    return rows[0];
  },

  async update(fields) {
    const keys = Object.keys(fields);
    if (keys.length === 0) return;
    
    const values = Object.values(fields);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    await db.execute(`UPDATE settings SET ${setClause} WHERE id = 1`, [...values]);
  },

  async initialize(defaultSettings) {
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM settings');
    if (rows[0].count === 0) {
      await db.execute(
        'INSERT INTO settings (id, company_name, email, phone, address, dark_mode, email_notifications, sms_notifications) VALUES (1, ?, ?, ?, ?, ?, ?, ?)',
        [
          defaultSettings.companyName || 'Cleaning Kit Package Builder',
          defaultSettings.email || 'admin@example.com',
          defaultSettings.phone || '+91 9876543210',
          defaultSettings.address || 'Hyderabad, India',
          defaultSettings.darkMode ? 1 : 0,
          defaultSettings.emailNotifications ? 1 : 0,
          defaultSettings.smsNotifications ? 1 : 0
        ]
      );
    }
  }
};

module.exports = Settings;
