const db = require('../config/db');

const Order = {
  async create({ customer_name, package_name, quantity, amount, status = 'Pending', customer_id = null, facility_type = null, facility_size = null, notes = null }) {
    const [result] = await db.execute(
      'INSERT INTO orders (customer_id, customer_name, package_name, quantity, amount, status, facility_type, facility_size, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [customer_id, customer_name, package_name, quantity, amount, status, facility_type, facility_size, notes]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM orders WHERE order_id = ?', [id]);
    return rows[0];
  },

  async findAll({ search = '', status = '', facility_type = '', customer_id = '', startDate = '', endDate = '', sort = 'created_at', order = 'DESC', page = 1, limit = 10 } = {}) {
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (customer_name LIKE ? OR package_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (facility_type) {
      query += ' AND facility_type = ?';
      params.push(facility_type);
    }

    if (customer_id) {
      query += ' AND customer_id = ?';
      params.push(customer_id);
    }

    if (startDate) {
      // Append start of day if only date is passed
      const start = startDate.includes(' ') || startDate.includes('T') ? startDate : `${startDate} 00:00:00`;
      query += ' AND created_at >= ?';
      params.push(start);
    }

    if (endDate) {
      // Append end of day if only date is passed
      const end = endDate.includes(' ') || endDate.includes('T') ? endDate : `${endDate} 23:59:59`;
      query += ' AND created_at <= ?';
      params.push(end);
    }

    const allowedSorts = ['order_id', 'customer_name', 'amount', 'status', 'created_at'];
    const allowedOrders = ['ASC', 'DESC'];
    if (allowedSorts.includes(sort) && allowedOrders.includes(order)) {
      query += ` ORDER BY ${sort} ${order}`;
    }

    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(String(limit), String(offset));

    const [rows] = await db.execute(query, params);
    return rows;
  },

  async count({ search = '', status = '', facility_type = '', customer_id = '', startDate = '', endDate = '' } = {}) {
    let query = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (customer_name LIKE ? OR package_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (facility_type) {
      query += ' AND facility_type = ?';
      params.push(facility_type);
    }

    if (customer_id) {
      query += ' AND customer_id = ?';
      params.push(customer_id);
    }

    if (startDate) {
      const start = startDate.includes(' ') || startDate.includes('T') ? startDate : `${startDate} 00:00:00`;
      query += ' AND created_at >= ?';
      params.push(start);
    }

    if (endDate) {
      const end = endDate.includes(' ') || endDate.includes('T') ? endDate : `${endDate} 23:59:59`;
      query += ' AND created_at <= ?';
      params.push(end);
    }

    const [rows] = await db.execute(query, params);
    return rows[0].total;
  },

  async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    await db.execute(`UPDATE orders SET ${setClause} WHERE order_id = ?`, [...values, id]);
  },

  async delete(id) {
    await db.execute('DELETE FROM orders WHERE order_id = ?', [id]);
  },

  async countAll() {
    const [rows] = await db.execute('SELECT COUNT(*) as total FROM orders');
    return rows[0].total;
  },

  async countByStatus(status) {
    const [rows] = await db.execute('SELECT COUNT(*) as total FROM orders WHERE status = ?', [status]);
    return rows[0].total;
  },

  async getRevenue() {
    const [rows] = await db.execute('SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE status IN ("Delivered", "Completed")');
    return rows[0].total;
  },

  async getRevenueByMonth() {
    const [rows] = await db.execute(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COALESCE(SUM(amount), 0) as revenue
      FROM orders WHERE status IN ("Delivered", "Completed")
      GROUP BY month ORDER BY month ASC LIMIT 12
    `);
    return rows;
  },

  async getSalesByProduct() {
    const [rows] = await db.execute(`
      SELECT p.name, COALESCE(SUM(oi.quantity), 0) as total_sold
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      GROUP BY p.name ORDER BY total_sold DESC LIMIT 10
    `);
    return rows;
  },

  async getStatusDistribution() {
    const [rows] = await db.execute('SELECT status, COUNT(*) as count FROM orders GROUP BY status');
    return rows;
  },

  /**
   * findCustomersDueForReminder({ reorderThresholdDays, reminderCooldownDays })
   * -----------------------------------------------------------------
   * Step 4: Reorder Reminders — finds each customer's MOST RECENT order
   * and flags it as "due" when:
   *   1. That order is older than `reorderThresholdDays` (customer likely
   *      ran out of supplies and hasn't reordered), AND
   *   2. It was never reminded, or the last reminder is older than
   *      `reminderCooldownDays` (so we don't spam the same customer every
   *      time the cron job runs).
   *
   * Cancelled orders are excluded since they were never fulfilled and
   * shouldn't anchor a "time to reorder" nudge. Customers with no email
   * on file are skipped — there's nothing to send.
   *
   * Returns rows shaped: { order_id, customer_id, name, email,
   *   facility_type, last_order_at, last_reminded_at }
   */
  async findCustomersDueForReminder({ reorderThresholdDays = 30, reminderCooldownDays = 14 } = {}) {
    const [rows] = await db.execute(
      `SELECT
         o.order_id,
         o.customer_id,
         c.name,
         c.email,
         o.facility_type,
         o.created_at AS last_order_at,
         o.last_reminded_at
       FROM orders o
       INNER JOIN customers c ON c.customer_id = o.customer_id
       INNER JOIN (
         -- Latest order per customer: a customer is only ever reminded
         -- based on their most recent order, never an older one.
         SELECT customer_id, MAX(created_at) AS max_created_at
         FROM orders
         WHERE customer_id IS NOT NULL AND status != 'cancelled'
         GROUP BY customer_id
       ) latest
         ON latest.customer_id = o.customer_id
        AND latest.max_created_at = o.created_at
       WHERE o.status != 'cancelled'
         AND c.email IS NOT NULL AND c.email != ''
         AND o.created_at <= DATE_SUB(NOW(), INTERVAL ? DAY)
         AND (o.last_reminded_at IS NULL OR o.last_reminded_at <= DATE_SUB(NOW(), INTERVAL ? DAY))`,
      [reorderThresholdDays, reminderCooldownDays]
    );
    return rows;
  },

  /**
   * markReminded(orderId)
   * Stamps last_reminded_at = NOW() so this order's customer won't be
   * picked up again until the next cooldown window elapses.
   */
  async markReminded(orderId) {
    await db.execute('UPDATE orders SET last_reminded_at = NOW() WHERE order_id = ?', [orderId]);
  }
};

module.exports = Order;
