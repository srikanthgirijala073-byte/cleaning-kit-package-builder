const db = require('../config/db');

const Customer = {
  async create({ name, email, phone = '', address = '', company = '', image = '' }) {
    const [result] = await db.execute(
      'INSERT INTO customers (name, email, phone, address, company, image) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone, address, company, image]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM customers WHERE customer_id = ?', [id]);
    return rows[0];
  },

  async findAll({ search = '', sort = 'created_at', order = 'DESC', page = 1, limit = 10 } = {}) {
    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR company LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const allowedSorts = ['name', 'email', 'company', 'created_at'];
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

  async count({ search = '' } = {}) {
    let query = 'SELECT COUNT(*) as total FROM customers WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR company LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [rows] = await db.execute(query, params);
    return rows[0].total;
  },

  async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    await db.execute(`UPDATE customers SET ${setClause} WHERE customer_id = ?`, [...values, id]);
  },

  async delete(id) {
    await db.execute('DELETE FROM customers WHERE customer_id = ?', [id]);
  },

  async countAll() {
    const [rows] = await db.execute('SELECT COUNT(*) as total FROM customers');
    return rows[0].total;
  },

  async getGrowthByMonth() {
    const [rows] = await db.execute(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
      FROM customers
      GROUP BY month ORDER BY month ASC LIMIT 12
    `);
    return rows;
  }
};

module.exports = Customer;
