const Settings = require('../models/Settings');

const settingsController = {
  async getSettings(req, res, next) {
    try {
      let settings = await Settings.get();
      if (!settings) {
        await Settings.initialize({
          companyName: 'Cleaning Kit Package Builder',
          email: 'admin@example.com',
          phone: '+91 9876543210',
          address: 'Hyderabad, India',
          darkMode: false,
          emailNotifications: true,
          smsNotifications: false
        });
        settings = await Settings.get();
      }
      res.json({
        companyName: settings.company_name,
        email: settings.email,
        phone: settings.phone,
        address: settings.address,
        darkMode: !!settings.dark_mode,
        emailNotifications: !!settings.email_notifications,
        smsNotifications: !!settings.sms_notifications
      });
    } catch (error) {
      next(error);
    }
  },

  async updateSettings(req, res, next) {
    try {
      const { companyName, email, phone, address, darkMode, emailNotifications, smsNotifications } = req.body;
      const fields = {};
      
      if (companyName !== undefined) fields.company_name = companyName;
      if (email !== undefined) fields.email = email;
      if (phone !== undefined) fields.phone = phone;
      if (address !== undefined) fields.address = address;
      if (darkMode !== undefined) fields.dark_mode = darkMode ? 1 : 0;
      if (emailNotifications !== undefined) fields.email_notifications = emailNotifications ? 1 : 0;
      if (smsNotifications !== undefined) fields.sms_notifications = smsNotifications ? 1 : 0;

      await Settings.update(fields);
      
      // Fetch the updated settings and return them
      const updated = await Settings.get();
      res.json({
        message: 'Settings saved successfully!',
        settings: {
          companyName: updated.company_name,
          email: updated.email,
          phone: updated.phone,
          address: updated.address,
          darkMode: !!updated.dark_mode,
          emailNotifications: !!updated.email_notifications,
          smsNotifications: !!updated.sms_notifications
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = settingsController;
