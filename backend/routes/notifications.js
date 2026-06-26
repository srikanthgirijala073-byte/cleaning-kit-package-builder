const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await query(
      `SELECT * FROM notifications WHERE user_id IS NULL OR user_id = ? ORDER BY created_at DESC LIMIT 20`,
      [req.user.userId]
    );

    // If no notifications exist, generate system notifications based on current state
    if (notifications.length === 0) {
      res.json([
        {
          id: 1,
          title: 'System Online',
          message: 'Cleaning Kit API database successfully connected.',
          type: 'success',
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);
    } else {
      res.json(notifications);
    }
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to load notifications' });
  }
});

module.exports = router;
