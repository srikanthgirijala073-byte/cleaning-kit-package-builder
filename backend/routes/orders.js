const express = require('express');
const router = express.Router();
const { query, getOne } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/orders
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', facility_type: facilityType = '', startDate = '', endDate = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let whereClause = 'WHERE 1=1';
    const params = [];

    // Role-based filtering: customers see only their own orders
    if (req.user.role === 'customer') {
      whereClause += ' AND o.user_id = ?';
      params.push(req.user.userId);
    }

    if (search) {
      whereClause += ' AND (o.customer_name LIKE ? OR o.package_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      whereClause += ' AND o.status = ?';
      params.push(status);
    }

    if (facilityType) {
      whereClause += ' AND o.facility_type = ?';
      params.push(facilityType);
    }

    if (startDate) {
      whereClause += ' AND o.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND o.created_at <= ?';
      params.push(endDate + ' 23:59:59');
    }

    const countResult = await getOne(`SELECT COUNT(*) as total FROM orders o ${whereClause}`, params);
    const total = countResult ? countResult.total : 0;

    const orders = await query(
      `SELECT o.* FROM orders o ${whereClause} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      orders,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Failed to load orders' });
  }
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await getOne('SELECT * FROM orders WHERE order_id = ?', [req.params.id]);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Customers can only see their own orders
    if (req.user.role === 'customer' && order.user_id !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const items = await query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);

    res.json({ ...order, items });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Failed to load order' });
  }
});

// POST /api/orders
router.post('/', authenticate, authorize('customer', 'staff', 'manager', 'admin'), async (req, res) => {
  try {
    const { customer_name, package_name, quantity, amount, status, items } = req.body;

    if (!customer_name || !package_name) {
      return res.status(400).json({ message: 'Customer name and package name are required' });
    }

    const result = await query(
      'INSERT INTO orders (user_id, customer_name, package_name, quantity, amount, status) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.userId, customer_name, package_name, parseInt(quantity) || 1, parseFloat(amount) || 0, status || 'Pending']
    );

    const orderId = result.insertId;

    // Insert order items
    if (items && Array.isArray(items)) {
      for (const item of items) {
        const product = await getOne('SELECT name, category FROM products WHERE product_id = ?', [item.product_id]);
        await query(
          'INSERT INTO order_items (order_id, product_id, product_name, category, quantity, price) VALUES (?, ?, ?, ?, ?, ?)',
          [orderId, item.product_id, product ? product.name : 'Unknown', product ? product.category : '', item.quantity || 1, parseFloat(item.price) || 0]
        );
      }
    }

    const order = await getOne('SELECT * FROM orders WHERE order_id = ?', [orderId]);

    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// POST /api/orders/process (smart bundle)
router.post('/process', authenticate, async (req, res) => {
  try {
    const { customer_name, package_name, facility_type, facility_size, focus_areas, notes } = req.body;

    if (!customer_name || !package_name) {
      return res.status(400).json({ message: 'Customer name and package name are required' });
    }

    // Get multiplier based on facility size
    const sizeMultiplier = facility_size === 'Small' ? 2 : facility_size === 'Medium' ? 5 : facility_size === 'Large' ? 10 : 5;

    // Get all active products
    const products = await query('SELECT * FROM products WHERE is_active = true AND stock > 0');

    if (products.length === 0) {
      return res.status(400).json({ message: 'No products available to build a package' });
    }

    let totalAmount = 0;
    const bundleItems = [];

    for (const product of products) {
      const quantity = Math.min(sizeMultiplier, product.stock);
      if (quantity > 0) {
        bundleItems.push({
          product_id: product.product_id,
          product_name: product.name,
          category: product.category,
          quantity,
          price: parseFloat(product.price),
        });
        totalAmount += parseFloat(product.price) * quantity;
      }
    }

    // Create order
    const result = await query(
      'INSERT INTO orders (user_id, customer_name, package_name, quantity, amount, status, facility_type, facility_size, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.userId, customer_name, package_name, bundleItems.length, totalAmount, 'Pending', facility_type || '', facility_size || '', notes || '']
    );

    const orderId = result.insertId;

    // Insert bundle items
    for (const item of bundleItems) {
      await query(
        'INSERT INTO order_items (order_id, product_id, product_name, category, quantity, price) VALUES (?, ?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.product_name, item.category, item.quantity, item.price]
      );
    }

    const order = await getOne('SELECT * FROM orders WHERE order_id = ?', [orderId]);

    res.status(201).json({
      order,
      items: bundleItems,
    });
  } catch (error) {
    console.error('Process bundle error:', error);
    res.status(500).json({ message: 'Failed to generate facility bundle' });
  }
});

// PUT /api/orders/:id
router.put('/:id', authenticate, authorize('staff', 'manager', 'admin'), async (req, res) => {
  try {
    const { status, customer_name, package_name, quantity, amount } = req.body;
    const order = await getOne('SELECT * FROM orders WHERE order_id = ?', [req.params.id]);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const updates = [];
    const params = [];

    if (status) { updates.push('status = ?'); params.push(status); }
    if (customer_name) { updates.push('customer_name = ?'); params.push(customer_name); }
    if (package_name) { updates.push('package_name = ?'); params.push(package_name); }
    if (quantity) { updates.push('quantity = ?'); params.push(parseInt(quantity)); }
    if (amount) { updates.push('amount = ?'); params.push(parseFloat(amount)); }

    if (updates.length > 0) {
      params.push(req.params.id);
      await query(`UPDATE orders SET ${updates.join(', ')} WHERE order_id = ?`, params);
    }

    const updated = await getOne('SELECT * FROM orders WHERE order_id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Failed to update order' });
  }
});

// DELETE /api/orders/:id
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const order = await getOne('SELECT * FROM orders WHERE order_id = ?', [req.params.id]);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await query('DELETE FROM orders WHERE order_id = ?', [req.params.id]);

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ message: 'Failed to delete order' });
  }
});

module.exports = router;
