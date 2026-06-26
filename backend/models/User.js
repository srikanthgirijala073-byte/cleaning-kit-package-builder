const db = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  async create({ name, email, password = null, google_id = null, github_id = null, microsoft_id = null, role = 'customer', phone = '', address = '', profile_image = '', email_verified = false }) {
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password, google_id, github_id, microsoft_id, role, phone, address, profile_image, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, google_id, github_id, microsoft_id, role, phone, address, profile_image, email_verified ? 1 : 0]
    );
    return result.insertId;
  },

  async findByEmail(email) {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },

  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [id]);
    return rows[0];
  },

  async findByGoogleId(googleId) {
    const [rows] = await db.execute('SELECT * FROM users WHERE google_id = ?', [googleId]);
    return rows[0];
  },

  async findByGithubId(githubId) {
    const [rows] = await db.execute('SELECT * FROM users WHERE github_id = ?', [githubId]);
    return rows[0];
  },

  async findByMicrosoftId(microsoftId) {
    const [rows] = await db.execute('SELECT * FROM users WHERE microsoft_id = ?', [microsoftId]);
    return rows[0];
  },

  async findAll() {
    const [rows] = await db.execute('SELECT user_id, name, email, role, phone, address, profile_image, email_verified, two_factor_enabled, failed_login_attempts, account_locked, lock_until, last_login, created_at FROM users ORDER BY created_at DESC');
    return rows;
  },

  async update(id, fields) {
    const keys = Object.keys(fields);
    if (keys.length === 0) return;
    const values = Object.values(fields);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    await db.execute(`UPDATE users SET ${setClause} WHERE user_id = ?`, [...values, id]);
  },

  async delete(id) {
    await db.execute('DELETE FROM users WHERE user_id = ?', [id]);
  },

  async count() {
    const [rows] = await db.execute('SELECT COUNT(*) as total FROM users');
    return rows[0].total;
  },

  async countByRole(role) {
    const [rows] = await db.execute('SELECT COUNT(*) as total FROM users WHERE role = ?', [role]);
    return rows[0].total;
  },

  async incrementFailedAttempts(id) {
    const user = await this.findById(id);
    const attempts = (user.failed_login_attempts || 0) + 1;
    const fields = { failed_login_attempts: attempts };
    
    if (attempts >= 5) {
      fields.account_locked = 1;
      // Lock for 15 minutes
      const lockTime = new Date(Date.now() + 15 * 60 * 1000);
      fields.lock_until = lockTime;
    }
    
    await this.update(id, fields);
    return fields;
  },

  async resetFailedAttempts(id) {
    await this.update(id, { failed_login_attempts: 0, account_locked: 0, lock_until: null });
  },

  async updateLastLogin(id) {
    await db.execute('UPDATE users SET last_login = NOW() WHERE user_id = ?', [id]);
  }
};

module.exports = User;
