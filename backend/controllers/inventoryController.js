const db = require('../config/db');
const Product = require('../models/Product');

const inventoryController = {
  async getInventory(req, res, next) {
    try {
      const { status, search, page, limit } = req.query;
      let query = `
        SELECT i.*, p.name, p.category, p.price, p.image
        FROM inventory i
        JOIN products p ON i.product_id = p.product_id
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        query += ' AND i.status = ?';
        params.push(status);
      }

      if (search) {
        query += ' AND (p.name LIKE ? OR p.category LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      query += ' ORDER BY i.current_stock ASC';

      const p = parseInt(page) || 1;
      const l = parseInt(limit) || 20;
      const offset = (p - 1) * l;

      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM (${query}) as sub`,
        params
      );
      const total = countResult[0].total;

      query += ' LIMIT ? OFFSET ?';
      params.push(String(l), String(offset));

      const [rows] = await db.execute(query, params);

      res.json({ inventory: rows, total, page: p, totalPages: Math.ceil(total / l) });
    } catch (error) {
      next(error);
    }
  },

  async updateInventory(req, res, next) {
    try {
      const { current_stock, minimum_stock } = req.body;
      const inventoryId = req.params.id;

      const fields = {};
      if (current_stock !== undefined) fields.current_stock = current_stock;
      if (minimum_stock !== undefined) fields.minimum_stock = minimum_stock;

      if (current_stock !== undefined || minimum_stock !== undefined) {
        const stock = current_stock !== undefined ? current_stock : null;
        const minStock = minimum_stock !== undefined ? minimum_stock : null;

        let statusUpdate = '';
        if (stock !== null) {
          if (minStock !== null) {
            statusUpdate = `, status = CASE WHEN ${stock} <= 0 THEN 'Out of Stock' WHEN ${stock} <= ${minStock} THEN 'Low Stock' ELSE 'In Stock' END`;
          } else {
            statusUpdate = `, status = CASE WHEN ${stock} <= 0 THEN 'Out of Stock' WHEN ${stock} <= (SELECT minimum_stock FROM inventory WHERE inventory_id = ${inventoryId}) THEN 'Low Stock' ELSE 'In Stock' END`;
          }
        }

        const setFields = Object.entries(fields).map(([k, v]) => `${k} = ${v}`).join(', ');
        await db.execute(`UPDATE inventory SET ${setFields}${statusUpdate} WHERE inventory_id = ?`, [inventoryId]);
      }

      const [rows] = await db.execute('SELECT i.*, p.name, p.category FROM inventory i JOIN products p ON i.product_id = p.product_id WHERE i.inventory_id = ?', [inventoryId]);
      res.json({ message: 'Inventory updated successfully', inventory: rows[0] });
    } catch (error) {
      next(error);
    }
  },

  async getLowStockAlerts(req, res, next) {
    try {
      const [rows] = await db.execute(`
        SELECT i.*, p.name, p.category, p.price, p.image
        FROM inventory i
        JOIN products p ON i.product_id = p.product_id
        WHERE i.current_stock <= i.minimum_stock
        ORDER BY i.current_stock ASC
      `);
      res.json(rows);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = inventoryController;
