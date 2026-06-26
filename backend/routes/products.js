const express = require('express');
const router = express.Router();
const { query, getOne } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// =======================
// Demo products — returned when MySQL DB is offline (e.g. Render free tier without DB)
// =======================
const DEMO_PRODUCTS = [
  { product_id: 1,  name: 'Multi-Surface Cleaner',      category: 'Surface Cleaners',   price: 299,  stock: 150, description: 'Powerful cleaner for all surfaces. Safe for kitchen, bathroom, and office use.', image: '', is_active: true, created_at: new Date().toISOString() },
  { product_id: 2,  name: 'Heavy-Duty Floor Cleaner',   category: 'Floor Care',          price: 450,  stock: 80,  description: 'Industrial-grade floor cleaner ideal for hospitals, hotels, and schools.',      image: '', is_active: true, created_at: new Date().toISOString() },
  { product_id: 3,  name: 'Toilet Bowl Cleaner',        category: 'Bathroom Care',       price: 180,  stock: 200, description: 'Removes tough stains and kills 99.9% of germs.',                               image: '', is_active: true, created_at: new Date().toISOString() },
  { product_id: 4,  name: 'Glass & Window Cleaner',     category: 'Glass Care',          price: 220,  stock: 120, description: 'Streak-free formula for crystal-clear windows and mirrors.',                   image: '', is_active: true, created_at: new Date().toISOString() },
  { product_id: 5,  name: 'Dishwashing Liquid',         category: 'Kitchen Care',        price: 150,  stock: 300, description: 'Gentle on hands, tough on grease. Lemon fragrance.',                          image: '', is_active: true, created_at: new Date().toISOString() },
  { product_id: 6,  name: 'Microfiber Cleaning Cloth',  category: 'Cleaning Tools',      price: 120,  stock: 500, description: 'Ultra-soft microfiber for dust-free, scratch-free cleaning.',                 image: '', is_active: true, created_at: new Date().toISOString() },
  { product_id: 7,  name: 'Mop & Bucket Set',           category: 'Mopping Equipment',   price: 850,  stock: 60,  description: 'Heavy-duty mop with spin bucket. Perfect for large floor areas.',             image: '', is_active: true, created_at: new Date().toISOString() },
  { product_id: 8,  name: 'Disinfectant Spray',         category: 'Disinfectants',       price: 350,  stock: 90,  description: 'Hospital-grade disinfectant spray. Kills bacteria and viruses.',               image: '', is_active: true, created_at: new Date().toISOString() },
  { product_id: 9,  name: 'Hand Sanitizer (500ml)',     category: 'Hygiene Products',    price: 199,  stock: 400, description: '70% alcohol-based sanitizer. WHO-recommended formula.',                       image: '', is_active: true, created_at: new Date().toISOString() },
  { product_id: 10, name: 'Air Freshener Spray',        category: 'Air Care',            price: 280,  stock: 180, description: 'Long-lasting fragrance for offices, hotels, and washrooms.',                  image: '', is_active: true, created_at: new Date().toISOString() },
  { product_id: 11, name: 'Scrub Pad (Pack of 6)',      category: 'Cleaning Tools',      price: 90,   stock: 600, description: 'Non-scratch scrub pads for pots, pans, and surfaces.',                       image: '', is_active: true, created_at: new Date().toISOString() },
  { product_id: 12, name: 'Broom & Dustpan Set',        category: 'Sweeping Equipment',  price: 320,  stock: 75,  description: 'Ergonomic broom with dustpan for efficient sweeping.',                       image: '', is_active: true, created_at: new Date().toISOString() },
  { product_id: 13, name: 'Bathroom Tile Cleaner',      category: 'Bathroom Care',       price: 260,  stock: 140, description: 'Removes soap scum, mold, and mildew from tiles and grout.',                  image: '', is_active: true, created_at: new Date().toISOString() },
  { product_id: 14, name: 'Liquid Hand Wash (1L)',      category: 'Hygiene Products',    price: 175,  stock: 350, description: 'Moisturizing antibacterial hand wash for frequent use.',                     image: '', is_active: true, created_at: new Date().toISOString() },
  { product_id: 15, name: 'Drain Unclogger Gel',        category: 'Drain Care',          price: 310,  stock: 110, description: 'Fast-acting gel dissolves hair, grease, and soap clogs.',                   image: '', is_active: true, created_at: new Date().toISOString() },
  { product_id: 16, name: 'Carpet Cleaner Foam',        category: 'Floor Care',          price: 390,  stock: 65,  description: 'Deep-clean carpets and rugs with stain-lifting foam formula.',               image: '', is_active: true, created_at: new Date().toISOString() },
  { product_id: 17, name: 'Stainless Steel Polish',     category: 'Surface Cleaners',    price: 330,  stock: 95,  description: 'Restores shine to steel appliances, sinks, and fixtures.',                   image: '', is_active: true, created_at: new Date().toISOString() },
  { product_id: 18, name: 'Garbage Bags (50 pcs)',      category: 'Waste Management',    price: 140,  stock: 800, description: 'Heavy-duty leak-proof garbage bags for office and home use.',                 image: '', is_active: true, created_at: new Date().toISOString() },
  { product_id: 19, name: 'Rubber Gloves (Pair)',       category: 'Safety Equipment',    price: 85,   stock: 700, description: 'Waterproof household gloves for safe chemical handling.',                    image: '', is_active: true, created_at: new Date().toISOString() },
  { product_id: 20, name: 'Wet Wipes (Pack of 100)',    category: 'Hygiene Products',    price: 210,  stock: 500, description: 'Antibacterial wipes for surfaces, hands, and equipment.',                    image: '', is_active: true, created_at: new Date().toISOString() },
];

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

    let products, total, categories, inStock, lowStock;

    try {
      const countResult = await getOne(`SELECT COUNT(*) as total FROM products p ${whereClause}`, params);
      total = countResult ? countResult.total : 0;

      products = await query(
        `SELECT p.* FROM products p ${whereClause} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      categories = await query("SELECT DISTINCT category FROM products WHERE category != '' AND is_active = true ORDER BY category");
      const inStockResult = await getOne("SELECT COUNT(*) as count FROM products WHERE is_active = true AND stock > 0");
      const lowStockResult = await getOne("SELECT COUNT(*) as count FROM products WHERE is_active = true AND stock < 10 AND stock >= 0");
      inStock = inStockResult ? inStockResult.count : 0;
      lowStock = lowStockResult ? lowStockResult.count : 0;
    } catch (dbErr) {
      // DB not available — use demo products fallback
      console.warn('Products DB error, using demo data:', dbErr.message);
      let filtered = DEMO_PRODUCTS;
      if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
      if (category) filtered = filtered.filter(p => p.category === category);
      total = filtered.length;
      products = filtered.slice(offset, offset + parseInt(limit));
      const allCats = [...new Set(DEMO_PRODUCTS.map(p => p.category))];
      categories = allCats.map(c => ({ category: c }));
      inStock = DEMO_PRODUCTS.filter(p => p.stock > 0).length;
      lowStock = DEMO_PRODUCTS.filter(p => p.stock < 10 && p.stock >= 0).length;
    }

    res.json({
      products,
      total,
      inStock,
      lowStock,
      totalPages: Math.ceil(total / parseInt(limit)),
      categories: Array.isArray(categories) && categories[0] && typeof categories[0] === 'object' && 'category' in categories[0]
        ? categories.map(c => c.category)
        : categories,
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to load products' });
  }
});


// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    let product;
    try {
      product = await getOne('SELECT * FROM products WHERE product_id = ?', [req.params.id]);
    } catch (dbErr) {
      console.warn('Get product by ID DB error, using demo data:', dbErr.message);
      product = DEMO_PRODUCTS.find(p => p.product_id === parseInt(req.params.id)) || null;
    }
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
