const db = require('../config/db');

const Product = {
  async create({ name, category, price, stock, rating = 0, image = '', description = '' }) {
    const [result] = await db.execute(
      'INSERT INTO products (name, category, price, stock, rating, image, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, category, price, stock, rating, image, description]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM products WHERE product_id = ?', [id]);
    return rows[0];
  },

  async findAll({ search = '', category = '', sort = 'created_at', order = 'DESC', page = 1, limit = 12 } = {}) {
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    const allowedSorts = ['name', 'price', 'stock', 'rating', 'created_at'];
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

  async count({ search = '', category = '' } = {}) {
    let query = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    const [rows] = await db.execute(query, params);
    return rows[0].total;
  },

  async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    await db.execute(`UPDATE products SET ${setClause} WHERE product_id = ?`, [...values, id]);
  },

  async delete(id) {
    await db.execute('DELETE FROM products WHERE product_id = ?', [id]);
  },

  async countAll() {
    const [rows] = await db.execute('SELECT COUNT(*) as total FROM products');
    return rows[0].total;
  },

  async getLowStock() {
    const [rows] = await db.execute('SELECT * FROM products WHERE stock < 10 ORDER BY stock ASC');
    return rows;
  },

  async getCategories() {
    const [rows] = await db.execute('SELECT DISTINCT category FROM products ORDER BY category');
    return rows.map(r => r.category);
  }
};

module.exports = Product;
