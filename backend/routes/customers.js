const express = require('express');
const router = express.Router();
const { query, getOne } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/customers
router.get('/', authenticate, authorize('manager', 'admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (name LIKE ? OR email LIKE ? OR company LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countResult = await getOne(`SELECT COUNT(*) as total FROM customers ${whereClause}`, params);
    const total = countResult ? countResult.total : 0;

    const customers = await query(
      `SELECT * FROM customers ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      customers,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'Failed to load customers' });
  }
});

// GET /api/customers/:id
router.get('/:id', authenticate, authorize('manager', 'admin'), async (req, res) => {
  try {
    const customer = await getOne('SELECT * FROM customers WHERE customer_id = ?', [req.params.id]);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ message: 'Failed to load customer' });
  }
});

// POST /api/customers
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, email, phone, company, address } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Customer name is required' });
    }

    const result = await query(
      'INSERT INTO customers (name, email, phone, company, address) VALUES (?, ?, ?, ?, ?)',
      [name, email || '', phone || '', company || '', address || '']
    );

    const customer = await getOne('SELECT * FROM customers WHERE customer_id = ?', [result.insertId]);
    res.status(201).json(customer);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ message: 'Failed to create customer' });
  }
});

// PUT /api/customers/:id
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, email, phone, company, address } = req.body;
    const customer = await getOne('SELECT * FROM customers WHERE customer_id = ?', [req.params.id]);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const updates = [];
    const params = [];

    if (name) { updates.push('name = ?'); params.push(name); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (company !== undefined) { updates.push('company = ?'); params.push(company); }
    if (address !== undefined) { updates.push('address = ?'); params.push(address); }

    if (updates.length > 0) {
      params.push(req.params.id);
      await query(`UPDATE customers SET ${updates.join(', ')} WHERE customer_id = ?`, params);
    }

    const updated = await getOne('SELECT * FROM customers WHERE customer_id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ message: 'Failed to update customer' });
  }
});

// DELETE /api/customers/:id
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const customer = await getOne('SELECT * FROM customers WHERE customer_id = ?', [req.params.id]);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await query('DELETE FROM customers WHERE customer_id = ?', [req.params.id]);
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ message: 'Failed to delete customer' });
  }
});

module.exports = router;
