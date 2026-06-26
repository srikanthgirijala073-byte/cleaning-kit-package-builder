/**
 * Simple audit logger - writes security events to the audit_logs table
 */
const { query } = require('../config/db');

const logAuditEvent = async (userId, action, details = '', ipAddress = '127.0.0.1') => {
  try {
    await query(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [userId, action, details, ipAddress]
    );
  } catch (error) {
    console.error('Failed to log audit event:', error.message);
  }
};

module.exports = { logAuditEvent };
