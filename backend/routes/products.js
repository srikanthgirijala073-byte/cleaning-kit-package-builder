const express = require('express');
const router = express.Router();
const { query, getOne } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let whereClause = 'WHERE p.is_active = true';
    const params = [];

    if (search) {
      whereClause += ' AND p.name LIKE ?';
      params.push(`%${search}%`);
    }

    if (category) {
      whereClause += ' AND p.category = ?';
      params.push(category);
    }

    const countResult = await getOne(`SELECT COUNT(*) as total FROM products p ${whereClause}`, params);
    const total = countResult ? countResult.total : 0;

    const products = await query(
      `SELECT p.* FROM products p ${whereClause} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const categories = await query('SELECT DISTINCT category FROM products WHERE category != \'\' AND is_active = true ORDER BY category');

    const inStockResult = await getOne("SELECT COUNT(*) as count FROM products WHERE is_active = true AND stock > 0");
    const lowStockResult = await getOne("SELECT COUNT(*) as count FROM products WHERE is_active = true AND stock < 10 AND stock >= 0");

    res.json({
      products,
      total,
      inStock: inStockResult ? inStockResult.count : 0,
      lowStock: lowStockResult ? lowStockResult.count : 0,
      totalPages: Math.ceil(total / parseInt(limit)),
      categories: categories.map(c => c.category),
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to load products' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await getOne('SELECT * FROM products WHERE product_id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Failed to load product' });
  }
});

// POST /api/products
router.post('/', authenticate, authorize('admin', 'manager'), upload.single('image'), async (req, res) => {
  try {
    const { name, category, price, stock, description } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : '';

    const result = await query(
      'INSERT INTO products (name, category, price, stock, description, image) VALUES (?, ?, ?, ?, ?, ?)',
      [name, category || '', parseFloat(price), parseInt(stock) || 0, description || '', imagePath]
    );

    // Also create inventory record
    const productId = result.insertId;
    const currentStock = parseInt(stock) || 0;
    const minStock = 10;
    const status = currentStock === 0 ? 'Out of Stock' : currentStock < minStock ? 'Low Stock' : 'In Stock';

    await query(
      'INSERT INTO inventory (product_id, name, category, current_stock, minimum_stock, status) VALUES (?, ?, ?, ?, ?, ?)',
      [productId, name, category || '', currentStock, minStock, status]
    );

    const product = await getOne('SELECT * FROM products WHERE product_id = ?', [productId]);

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Failed to create product' });
  }
});

// PUT /api/products/:id
router.put('/:id', authenticate, authorize('admin', 'manager'), upload.single('image'), async (req, res) => {
  try {
    const { name, category, price, stock, description } = req.body;
    const product = await getOne('SELECT * FROM products WHERE product_id = ?', [req.params.id]);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updates = [];
    const params = [];

    if (name) { updates.push('name = ?'); params.push(name); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (price !== undefined) { updates.push('price = ?'); params.push(parseFloat(price)); }
    if (stock !== undefined) { updates.push('stock = ?'); params.push(parseInt(stock)); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (req.file) { updates.push('image = ?'); params.push(`/uploads/${req.file.filename}`); }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    params.push(req.params.id);
    await query(`UPDATE products SET ${updates.join(', ')} WHERE product_id = ?`, params);

    // Update inventory as well
    if (stock !== undefined) {
      const currentStock = parseInt(stock);
      const inventoryItem = await getOne('SELECT * FROM inventory WHERE product_id = ?', [req.params.id]);
      if (inventoryItem) {
        const status = currentStock === 0 ? 'Out of Stock' : currentStock < inventoryItem.minimum_stock ? 'Low Stock' : 'In Stock';
        await query(
          'UPDATE inventory SET current_stock = ?, status = ?, name = ?, category = ? WHERE product_id = ?',
          [currentStock, status, name || product.name, category || product.category, req.params.id]
        );
      }
    }

    const updated = await getOne('SELECT * FROM products WHERE product_id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const product = await getOne('SELECT * FROM products WHERE product_id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await query('UPDATE products SET is_active = false WHERE product_id = ?', [req.params.id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

module.exports = router;
