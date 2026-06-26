const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/authMiddleware');

// Get all notifications
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.put('/:id/read', authMiddleware, async (req, res, next) => {
  try {
    await db.execute('UPDATE notifications SET is_read = TRUE WHERE notification_id = ?', [req.params.id]);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
});

// Delete notification
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    await db.execute('DELETE FROM notifications WHERE notification_id = ?', [req.params.id]);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
