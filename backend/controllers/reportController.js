const db = require('../config/db');

const reportController = {
  async getSalesReport(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      let query = `
        SELECT o.order_id, o.customer_name, o.package_name, o.amount, o.status, o.created_at,
               GROUP_CONCAT(CONCAT(p.name, ' (', oi.quantity, ')') SEPARATOR ', ') as items
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.product_id
        WHERE 1=1
      `;
      const params = [];

      if (startDate) {
        query += ' AND o.created_at >= ?';
        params.push(startDate);
      }
      if (endDate) {
        query += ' AND o.created_at <= ?';
        params.push(endDate);
      }

      query += ' GROUP BY o.order_id ORDER BY o.created_at DESC';

      const [rows] = await db.execute(query, params);
      const totalSales = rows.reduce((sum, r) => sum + parseFloat(r.amount), 0);

      res.json({ report: rows, totalSales, totalOrders: rows.length });
    } catch (error) {
      next(error);
    }
  },

  async getRevenueReport(req, res, next) {
    try {
      const [monthlyRevenue] = await db.execute(`
        SELECT DATE_FORMAT(created_at, '%Y-%m') as month,
               SUM(amount) as revenue,
               COUNT(*) as orders_count
        FROM orders
        WHERE status IN ('Delivered', 'Completed')
        GROUP BY month
        ORDER BY month DESC
        LIMIT 12
      `);

      const [statusDist] = await db.execute(
        'SELECT status, COUNT(*) as count, SUM(amount) as total FROM orders GROUP BY status'
      );

      res.json({ monthlyRevenue, statusDistribution: statusDist });
    } catch (error) {
      next(error);
    }
  },

  async getInventoryReport(req, res, next) {
    try {
      const [lowStock] = await db.execute(`
        SELECT i.*, p.name, p.category, p.price
        FROM inventory i
        JOIN products p ON i.product_id = p.product_id
        WHERE i.current_stock <= i.minimum_stock
        ORDER BY i.current_stock ASC
      `);

      const [summary] = await db.execute(`
        SELECT
          COUNT(*) as total_products,
          SUM(CASE WHEN status = 'In Stock' THEN 1 ELSE 0 END) as in_stock,
          SUM(CASE WHEN status = 'Low Stock' THEN 1 ELSE 0 END) as low_stock,
          SUM(CASE WHEN status = 'Out of Stock' THEN 1 ELSE 0 END) as out_of_stock,
          SUM(current_stock) as total_stock
        FROM inventory
      `);

      const [topSelling] = await db.execute(`
        SELECT p.name, SUM(oi.quantity) as total_sold
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        GROUP BY p.name
        ORDER BY total_sold DESC
        LIMIT 10
      `);

      res.json({ lowStock, summary: summary[0], topSelling });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = reportController;
