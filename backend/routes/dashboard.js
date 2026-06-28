const express = require('express');
const router = express.Router();
const { query, getOne } = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    let orderFilter = '';
    const params = [];

    // Customers see only their own stats
    if (req.user.role === 'customer') {
      orderFilter = ' WHERE user_id = ?';
      params.push(req.user.userId);
    }

    try {
      const totalOrders = await getOne(`SELECT COUNT(*) as count FROM orders${orderFilter}`, params);
      const totalRevenue = await getOne(`SELECT COALESCE(SUM(amount), 0) as total FROM orders${orderFilter ? orderFilter + " AND status IN ('delivered', 'shipped')" : " WHERE status IN ('delivered', 'shipped')"}`, params);
      const pendingOrders = await getOne(`SELECT COUNT(*) as count FROM orders${orderFilter ? orderFilter + " AND status = 'placed'" : " WHERE status = 'placed'"}`, params);
      const processingOrders = await getOne(`SELECT COUNT(*) as count FROM orders${orderFilter ? orderFilter + " AND status = 'processing'" : " WHERE status = 'processing'"}`, params);
      const totalCustomers = await getOne('SELECT COUNT(*) as count FROM customers');
      const totalProducts = await getOne('SELECT COUNT(*) as count FROM products WHERE is_active = true');
      const lowStockProducts = await getOne("SELECT COUNT(*) as count FROM inventory WHERE status IN ('Low Stock', 'Out of Stock')");

      res.json({
        totalOrders: totalOrders ? totalOrders.count : 0,
        totalRevenue: totalRevenue ? parseFloat(totalRevenue.total) : 0,
        totalCustomers: totalCustomers ? totalCustomers.count : 0,
        totalProducts: totalProducts ? totalProducts.count : 0,
        pendingOrders: pendingOrders ? pendingOrders.count : 0,
        processingOrders: processingOrders ? processingOrders.count : 0,
        lowStockProducts: lowStockProducts ? lowStockProducts.count : 0,
      });
    } catch (dbErr) {
      console.warn('Dashboard stats DB error, returning demo stats:', dbErr.message);
      res.json({ totalOrders: 0, totalRevenue: 0, totalCustomers: 0, totalProducts: 20, pendingOrders: 0, processingOrders: 0, lowStockProducts: 0, _demo: true });
    }
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to load dashboard stats' });
  }
});


// GET /api/dashboard/charts
router.get('/charts', authenticate, async (req, res) => {
  try {
    const monthlyData = await query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as orders,
        COALESCE(SUM(amount), 0) as revenue
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `);

    const statusDistribution = await query(`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
    `);

    const categoryDistribution = await query(`
      SELECT category, COUNT(*) as count
      FROM products
      WHERE is_active = true AND category != ''
      GROUP BY category
    `);

    res.json({ monthlyData, statusDistribution, categoryDistribution });
  } catch (error) {
    console.error('Dashboard charts error:', error);
    res.status(500).json({ message: 'Failed to load charts' });
  }
});

// GET /api/dashboard/recent-orders
router.get('/recent-orders', authenticate, async (req, res) => {
  try {
    let whereClause = '';
    const params = [];

    if (req.user.role === 'customer') {
      whereClause = ' WHERE user_id = ?';
      params.push(req.user.userId);
    }

    const orders = await query(
      `SELECT o.* FROM orders o ${whereClause} ORDER BY o.created_at DESC LIMIT 5`,
      params
    );

    res.json(orders);
  } catch (error) {
    console.error('Recent orders error:', error);
    res.status(500).json({ message: 'Failed to load recent orders' });
  }
});

module.exports = router;
