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

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    await query('UPDATE notifications SET is_read = TRUE WHERE notification_id = ?', [req.params.id]);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Failed to update notification' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await query('DELETE FROM notifications WHERE notification_id = ?', [req.params.id]);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

module.exports = router;
