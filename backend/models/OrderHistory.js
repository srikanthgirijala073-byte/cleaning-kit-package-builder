const db = require('../config/db');

const OrderHistory = {
  async create({ order_id, status, notes = '' }) {
    const [result] = await db.execute(
      'INSERT INTO order_history (order_id, status, notes) VALUES (?, ?, ?)',
      [order_id, status, notes]
    );
    return result.insertId;
  },

  async findByOrderId(order_id) {
    const [rows] = await db.execute(
      'SELECT * FROM order_history WHERE order_id = ? ORDER BY created_at ASC',
      [order_id]
    );
    return rows;
  },

  async deleteByOrderId(order_id) {
    await db.execute('DELETE FROM order_history WHERE order_id = ?', [order_id]);
  }
};

module.exports = OrderHistory;
