const express = require('express');
const router = express.Router();
const { query, getOne } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/settings
router.get('/', authenticate, async (req, res) => {
  try {
    let settings = await getOne('SELECT * FROM settings WHERE id = 1');

    if (!settings) {
      // Create default settings if none exist
      await query(`
        INSERT INTO settings (company_name, email, phone, address, dark_mode, email_notifications, sms_notifications, login_notification_emails)
        VALUES ('Cleaning Kit Builder', 'admin@example.com', '+1-555-0100', '123 Business Ave, Suite 100', false, true, false, true)
      `);
      settings = await getOne('SELECT * FROM settings WHERE id = 1');
    }

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Failed to load settings' });
  }
});

// PUT /api/settings
router.put('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { companyName, email, phone, address, darkMode, emailNotifications, smsNotifications, loginNotificationEmails } = req.body;

    await query(
      `UPDATE settings SET 
        company_name = ?, email = ?, phone = ?, address = ?, 
        dark_mode = ?, email_notifications = ?, sms_notifications = ?, 
        login_notification_emails = ?
       WHERE id = 1`,
      [
        companyName || '',
        email || '',
        phone || '',
        address || '',
        darkMode || false,
        emailNotifications !== undefined ? emailNotifications : true,
        smsNotifications || false,
        loginNotificationEmails !== undefined ? loginNotificationEmails : true,
      ]
    );

    const settings = await getOne('SELECT * FROM settings WHERE id = 1');
    res.json({ message: 'Settings saved successfully!', ...settings });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Failed to save settings' });
  }
});

module.exports = router;
