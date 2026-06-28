const express = require('express');
const router = express.Router();
const { query, getOne } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/reports/sales
router.get('/sales', authenticate, authorize('manager', 'admin'), async (req, res) => {
  try {
    const { startDate = '', endDate = '' } = req.query;
    let dateFilter = '';
    const params = [];

    if (startDate) {
      dateFilter += ' AND o.created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      dateFilter += ' AND o.created_at <= ?';
      params.push(endDate + ' 23:59:59');
    }

    const report = await query(
      `SELECT o.*, GROUP_CONCAT(oi.product_name SEPARATOR ', ') as items 
       FROM orders o 
       LEFT JOIN order_items oi ON o.order_id = oi.order_id 
       WHERE o.status IN ('Delivered', 'Completed') ${dateFilter}
       GROUP BY o.order_id 
       ORDER BY o.created_at DESC LIMIT 100`,
      params
    );

    const totalResult = await getOne(
      `SELECT COUNT(*) as totalOrders, COALESCE(SUM(amount), 0) as totalSales 
       FROM orders WHERE status IN ('Delivered', 'Completed') ${dateFilter}`,
      params
    );

    res.json({
      report,
      totalOrders: totalResult ? totalResult.totalOrders : 0,
      totalSales: totalResult ? totalResult.totalSales : 0,
    });
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({ message: 'Failed to generate sales report' });
  }
});

// GET /api/reports/revenue
router.get('/revenue', authenticate, authorize('manager', 'admin'), async (req, res) => {
  try {
    const monthlyRevenue = await query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COALESCE(SUM(amount), 0) as revenue,
        COUNT(*) as orders_count
      FROM orders 
      WHERE status IN ('Delivered', 'Completed')
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `);

    res.json({ monthlyRevenue });
  } catch (error) {
    console.error('Revenue report error:', error);
    res.status(500).json({ message: 'Failed to generate revenue report' });
  }
});

// GET /api/reports/inventory
router.get('/inventory', authenticate, authorize('manager', 'admin'), async (req, res) => {
  try {
    const summary = await getOne(`
      SELECT 
        COUNT(*) as total_products,
        COALESCE(SUM(current_stock), 0) as total_stock,
        SUM(CASE WHEN status = 'In Stock' THEN 1 ELSE 0 END) as in_stock,
        SUM(CASE WHEN status = 'Low Stock' THEN 1 ELSE 0 END) as low_stock,
        SUM(CASE WHEN status = 'Out of Stock' THEN 1 ELSE 0 END) as out_of_stock
      FROM inventory
    `);

    const lowStock = await query(`
      SELECT i.*, p.price 
      FROM inventory i 
      LEFT JOIN products p ON i.product_id = p.product_id 
      WHERE i.status IN ('Low Stock', 'Out of Stock') 
      ORDER BY i.current_stock ASC
    `);

    res.json({ summary, lowStock });
  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({ message: 'Failed to generate inventory report' });
  }
});

module.exports = router;
