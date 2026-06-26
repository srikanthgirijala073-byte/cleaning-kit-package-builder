const db = require('../config/db');

const OrderItem = {
  async create({ order_id, product_id, quantity, price }) {
    const [result] = await db.execute(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
      [order_id, product_id, quantity, price]
    );
    return result.insertId;
  },

  async findByOrderId(order_id) {
    const [rows] = await db.execute(
      `SELECT oi.*, p.name as product_name, p.image as product_image
       FROM order_items oi
       JOIN products p ON oi.product_id = p.product_id
       WHERE oi.order_id = ?`,
      [order_id]
    );
    return rows;
  },

  async deleteByOrderId(order_id) {
    await db.execute('DELETE FROM order_items WHERE order_id = ?', [order_id]);
  }
};

module.exports = OrderItem;
