const express = require('express');
const router = express.Router();
const { query, getOne } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/inventory
router.get('/', authenticate, authorize('manager', 'admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (i.name LIKE ?)';
      params.push(`%${search}%`);
    }

    if (status) {
      whereClause += ' AND i.status = ?';
      params.push(status);
    }

    const countResult = await getOne(`SELECT COUNT(*) as total FROM inventory i ${whereClause}`, params);
    const total = countResult ? countResult.total : 0;

    const inventory = await query(
      `SELECT i.*, p.price FROM inventory i LEFT JOIN products p ON i.product_id = p.product_id ${whereClause} ORDER BY i.updated_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      inventory,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ message: 'Failed to load inventory' });
  }
});

// PUT /api/inventory/:id
router.put('/:id', authenticate, authorize('manager', 'admin'), async (req, res) => {
  try {
    const { current_stock, minimum_stock } = req.body;
    const item = await getOne('SELECT * FROM inventory WHERE inventory_id = ?', [req.params.id]);

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const newStock = current_stock !== undefined ? parseInt(current_stock) : item.current_stock;
    const newMinStock = minimum_stock !== undefined ? parseInt(minimum_stock) : item.minimum_stock;

    const status = newStock === 0 ? 'Out of Stock' : newStock < newMinStock ? 'Low Stock' : 'In Stock';

    await query(
      'UPDATE inventory SET current_stock = ?, minimum_stock = ?, status = ? WHERE inventory_id = ?',
      [newStock, newMinStock, status, req.params.id]
    );

    // Also update the products table stock
    await query('UPDATE products SET stock = ? WHERE product_id = ?', [newStock, item.product_id]);

    const updated = await getOne('SELECT * FROM inventory WHERE inventory_id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ message: 'Failed to update inventory' });
  }
});

module.exports = router;
