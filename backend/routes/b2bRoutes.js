const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { pool } = require('../config/db');
const { authMiddleware } = require('../middleware/authMiddleware');

const protect = authMiddleware;

// ── QUOTATIONS ──────────────────────────────────────────────────────────────
router.get('/quotations', protect, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM quotations ORDER BY created_at DESC');
    res.json({ quotations: rows, total: rows.length });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/quotations/:id', protect, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM quotations WHERE id=?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Quotation not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/quotations', protect, async (req, res) => {
  try {
    const { customer_name, customer_id, package_name, facility_type, items, total_amount, valid_until, notes } = req.body;
    if (!customer_name) return res.status(400).json({ message: 'customer_name is required' });

    // Resolve customer_id from user's email if not provided or to ensure it is valid
    let resolvedCustomerId = customer_id || null;
    if (req.user?.email) {
      const [custRows] = await pool.query('SELECT customer_id FROM customers WHERE email = ?', [req.user.email]);
      if (custRows[0]) {
        resolvedCustomerId = custRows[0].customer_id;
      } else {
        resolvedCustomerId = null; // Prevent foreign key constraint failure for non-customer users (admin/staff)
      }
    }

    const [result] = await pool.query(
      'INSERT INTO quotations (customer_name,customer_id,package_name,facility_type,items,total_amount,valid_until,notes,created_by) VALUES (?,?,?,?,?,?,?,?,?)',
      [customer_name, resolvedCustomerId, package_name || '', facility_type || '', JSON.stringify(items || []), total_amount || 0, valid_until || null, notes || '', req.user?.user_id || null]
    );

    // Find all admin, manager, and staff users to notify them
    try {
      const [staffUsers] = await pool.query("SELECT user_id FROM users WHERE role IN ('admin', 'manager', 'staff')");
      for (const u of staffUsers) {
        await pool.query(
          "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
          [
            u.user_id,
            "New Quote Request",
            `Customer ${customer_name} has requested a quote for "${package_name || 'Custom Package'}" (Total: ₹${Math.round(total_amount)}).`,
            "info"
          ]
        );
      }
    } catch (notifErr) {
      console.error("Failed to create quote notifications:", notifErr.message);
    }

    const [created] = await pool.query('SELECT * FROM quotations WHERE id=?', [result.insertId]);
    res.status(201).json(created[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/quotations/:id', protect, async (req, res) => {
  try {
    const { customer_name, package_name, items, total_amount, status, valid_until, notes } = req.body;
    await pool.query(
      'UPDATE quotations SET customer_name=?,package_name=?,items=?,total_amount=?,status=?,valid_until=?,notes=? WHERE id=?',
      [customer_name, package_name || '', JSON.stringify(items || []), total_amount || 0, status || 'Draft', valid_until || null, notes || '', req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM quotations WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/quotations/:id', protect, async (req, res) => {
  try {
    await pool.query('DELETE FROM quotations WHERE id=?', [req.params.id]);
    res.json({ message: 'Quotation deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/quotations/:id/convert', protect, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM quotations WHERE id=?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Quotation not found' });
    const q = rows[0];
    const [orderResult] = await pool.query(
      'INSERT INTO orders (customer_id, status, amount, notes) VALUES (?,?,?,?)',
      [q.customer_id || null, 'placed', q.total_amount, `Converted from Quotation #${q.id} - ${q.package_name}`]
    );
    await pool.query("UPDATE quotations SET status='Converted' WHERE id=?", [q.id]);
    res.json({ message: 'Converted to order', order_id: orderResult.insertId });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── DELIVERIES ──────────────────────────────────────────────────────────────
router.get('/deliveries', protect, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM deliveries ORDER BY created_at DESC');
    res.json({ deliveries: rows, total: rows.length });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/deliveries/:id', protect, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM deliveries WHERE id=?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Delivery not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/deliveries', protect, async (req, res) => {
  try {
    const { customer_name, order_id, address, delivery_date, driver_name, vehicle_number, notes } = req.body;
    if (!customer_name) return res.status(400).json({ message: 'customer_name is required' });
    const [result] = await pool.query(
      'INSERT INTO deliveries (customer_name,order_id,address,delivery_date,driver_name,vehicle_number,notes) VALUES (?,?,?,?,?,?,?)',
      [customer_name, order_id || null, address || '', delivery_date || null, driver_name || '', vehicle_number || '', notes || '']
    );
    const [rows] = await pool.query('SELECT * FROM deliveries WHERE id=?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/deliveries/:id', protect, async (req, res) => {
  try {
    const { customer_name, address, delivery_date, status, driver_name, vehicle_number, notes } = req.body;
    await pool.query(
      'UPDATE deliveries SET customer_name=?,address=?,delivery_date=?,status=?,driver_name=?,vehicle_number=?,notes=? WHERE id=?',
      [customer_name, address || '', delivery_date || null, status || 'Scheduled', driver_name || '', vehicle_number || '', notes || '', req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM deliveries WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.patch('/deliveries/:id/status', protect, async (req, res) => {
  try {
    await pool.query('UPDATE deliveries SET status=? WHERE id=?', [req.body.status, req.params.id]);
    res.json({ message: 'Delivery status updated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── SALESMAN VISITS ─────────────────────────────────────────────────────────
router.get('/visits', protect, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM salesman_visits ORDER BY visit_date DESC');
    res.json({ visits: rows, total: rows.length });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/visits', protect, async (req, res) => {
  try {
    const { customer_name, customer_id, salesman_name, visit_date, purpose, outcome, follow_up_date, notes } = req.body;
    if (!customer_name || !salesman_name || !visit_date) return res.status(400).json({ message: 'customer_name, salesman_name, visit_date are required' });
    const [result] = await pool.query(
      'INSERT INTO salesman_visits (customer_name,customer_id,salesman_name,visit_date,purpose,outcome,follow_up_date,notes) VALUES (?,?,?,?,?,?,?,?)',
      [customer_name, customer_id || null, salesman_name, visit_date, purpose || '', outcome || '', follow_up_date || null, notes || '']
    );
    const [rows] = await pool.query('SELECT * FROM salesman_visits WHERE id=?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/visits/:id', protect, async (req, res) => {
  try {
    const { customer_name, salesman_name, visit_date, purpose, outcome, status, follow_up_date, notes } = req.body;
    await pool.query(
      'UPDATE salesman_visits SET customer_name=?,salesman_name=?,visit_date=?,purpose=?,outcome=?,status=?,follow_up_date=?,notes=? WHERE id=?',
      [customer_name, salesman_name, visit_date, purpose || '', outcome || '', status || 'Scheduled', follow_up_date || null, notes || '', req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM salesman_visits WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/visits/:id', protect, async (req, res) => {
  try {
    await pool.query('DELETE FROM salesman_visits WHERE id=?', [req.params.id]);
    res.json({ message: 'Visit deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── REORDERS ────────────────────────────────────────────────────────────────
router.get('/reorders', protect, async (req, res) => {
  try {
    const status = req.query.status;
    const [rows] = status
      ? await pool.query('SELECT * FROM reorders WHERE status=? ORDER BY created_at DESC', [status])
      : await pool.query('SELECT * FROM reorders ORDER BY created_at DESC');
    res.json({ reorders: rows, total: rows.length });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/reorders/suggestions', protect, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT p.product_id, p.name as product_name, p.stock as current_stock, p.min_stock_level FROM products p WHERE p.stock <= p.min_stock_level AND p.is_active = 1'
    );
    const suggestions = rows.map(r => ({
      product_id: r.product_id,
      product_name: r.product_name,
      current_stock: r.current_stock,
      minimum_stock: r.min_stock_level,
      suggested_quantity: Math.max(r.min_stock_level * 2, 10),
    }));
    res.json({ suggestions });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/reorders', protect, async (req, res) => {
  try {
    const { product_id, product_name, quantity, supplier, notes, source } = req.body;
    if (!product_name || !quantity) return res.status(400).json({ message: 'product_name and quantity are required' });
    const [result] = await pool.query(
      'INSERT INTO reorders (product_id,product_name,quantity,supplier,notes,source,requested_by) VALUES (?,?,?,?,?,?,?)',
      [product_id || null, product_name, quantity, supplier || '', notes || '', source || 'manual', req.user?.user_id || null]
    );
    const [rows] = await pool.query('SELECT * FROM reorders WHERE id=?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.patch('/reorders/:id/approve', protect, async (req, res) => {
  try {
    await pool.query("UPDATE reorders SET status='Approved', approved_by=? WHERE id=?", [req.user?.user_id || null, req.params.id]);
    res.json({ message: 'Reorder approved' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── CONTRACTS ───────────────────────────────────────────────────────────────
router.get('/contracts', protect, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM contracts ORDER BY created_at DESC');
    res.json({ contracts: rows, total: rows.length });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/contracts', protect, async (req, res) => {
  try {
    const { customer_name, customer_id, contract_name, discount_percent, tier, start_date, end_date, terms } = req.body;
    if (!customer_name || !contract_name) return res.status(400).json({ message: 'customer_name and contract_name are required' });
    const [result] = await pool.query(
      'INSERT INTO contracts (customer_name,customer_id,contract_name,discount_percent,tier,start_date,end_date,terms) VALUES (?,?,?,?,?,?,?,?)',
      [customer_name, customer_id || null, contract_name, discount_percent || 0, tier || 'Bronze', start_date || null, end_date || null, terms || '']
    );
    const [rows] = await pool.query('SELECT * FROM contracts WHERE id=?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/contracts/:id', protect, async (req, res) => {
  try {
    const { customer_name, contract_name, discount_percent, tier, start_date, end_date, status, terms } = req.body;
    await pool.query(
      'UPDATE contracts SET customer_name=?,contract_name=?,discount_percent=?,tier=?,start_date=?,end_date=?,status=?,terms=? WHERE id=?',
      [customer_name, contract_name, discount_percent || 0, tier || 'Bronze', start_date || null, end_date || null, status || 'Active', terms || '', req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM contracts WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/contracts/:id', protect, async (req, res) => {
  try {
    await pool.query('DELETE FROM contracts WHERE id=?', [req.params.id]);
    res.json({ message: 'Contract deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/contracts/pricing/:customerId', protect, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM contracts WHERE customer_id=? AND status='Active' ORDER BY discount_percent DESC LIMIT 1",
      [req.params.customerId]
    );
    res.json({ contract: rows[0] || null, has_contract: !!rows[0] });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── COMPLIANCE ──────────────────────────────────────────────────────────────
router.get('/compliance', protect, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM compliance_records ORDER BY created_at DESC');
    res.json({ records: rows, total: rows.length });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/compliance', protect, async (req, res) => {
  try {
    const { customer_name, customer_id, compliance_type, description, severity, target_date, findings, action_taken } = req.body;
    if (!customer_name || !compliance_type) return res.status(400).json({ message: 'customer_name and compliance_type are required' });
    const [result] = await pool.query(
      'INSERT INTO compliance_records (customer_name,customer_id,compliance_type,description,severity,target_date,findings,action_taken) VALUES (?,?,?,?,?,?,?,?)',
      [customer_name, customer_id || null, compliance_type, description || '', severity || 'Medium', target_date || null, findings || '', action_taken || '']
    );
    const [rows] = await pool.query('SELECT * FROM compliance_records WHERE id=?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/compliance/:id', protect, async (req, res) => {
  try {
    const { status, findings, action_taken, severity, target_date } = req.body;
    await pool.query(
      'UPDATE compliance_records SET status=?,findings=?,action_taken=?,severity=?,target_date=? WHERE id=?',
      [status || 'Open', findings || '', action_taken || '', severity || 'Medium', target_date || null, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM compliance_records WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/compliance/:id/audit', protect, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM compliance_records WHERE id=?', [req.params.id]);
    res.json({ record: rows[0] || null, audit: [] });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── WAREHOUSES ──────────────────────────────────────────────────────────────
router.get('/warehouses', protect, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM warehouses ORDER BY id');
    res.json({ warehouses: rows, total: rows.length });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/warehouses', protect, async (req, res) => {
  try {
    const { name, location, manager_name, capacity } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });
    const [result] = await pool.query(
      'INSERT INTO warehouses (name,location,manager_name,capacity) VALUES (?,?,?,?)',
      [name, location || '', manager_name || '', capacity || 0]
    );
    const [rows] = await pool.query('SELECT * FROM warehouses WHERE id=?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/warehouses/:id', protect, async (req, res) => {
  try {
    const { name, location, manager_name, capacity, status } = req.body;
    await pool.query(
      'UPDATE warehouses SET name=?,location=?,manager_name=?,capacity=?,status=? WHERE id=?',
      [name, location || '', manager_name || '', capacity || 0, status || 'Active', req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM warehouses WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/warehouses/:id/stock', protect, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM warehouse_stock WHERE warehouse_id=?', [req.params.id]);
    res.json({ stock: rows });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/warehouses/:id/stock', protect, async (req, res) => {
  try {
    const { product_id, product_name, zone, bin_location, quantity } = req.body;
    const [result] = await pool.query(
      'INSERT INTO warehouse_stock (warehouse_id,product_id,product_name,zone,bin_location,quantity) VALUES (?,?,?,?,?,?)',
      [req.params.id, product_id || null, product_name || '', zone || '', bin_location || '', quantity || 0]
    );
    const [rows] = await pool.query('SELECT * FROM warehouse_stock WHERE id=?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/warehouses/:wid/stock/:sid', protect, async (req, res) => {
  try {
    const { quantity, zone, bin_location } = req.body;
    await pool.query(
      'UPDATE warehouse_stock SET quantity=?,zone=?,bin_location=? WHERE id=? AND warehouse_id=?',
      [quantity, zone || '', bin_location || '', req.params.sid, req.params.wid]
    );
    res.json({ message: 'Stock updated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── B2B ACCOUNTS ────────────────────────────────────────────────────────────
router.get('/accounts', protect, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM b2b_accounts ORDER BY created_at DESC');
    res.json({ accounts: rows, total: rows.length });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/accounts/:id', protect, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM b2b_accounts WHERE id=?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Account not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/accounts', protect, async (req, res) => {
  try {
    const { customer_name, customer_id, credit_limit, payment_terms, notes } = req.body;
    if (!customer_name) return res.status(400).json({ message: 'customer_name is required' });
    const [result] = await pool.query(
      'INSERT INTO b2b_accounts (customer_name,customer_id,credit_limit,payment_terms,notes) VALUES (?,?,?,?,?)',
      [customer_name, customer_id || null, credit_limit || 0, payment_terms || 'Net 30', notes || '']
    );
    const [rows] = await pool.query('SELECT * FROM b2b_accounts WHERE id=?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/accounts/:id', protect, async (req, res) => {
  try {
    const { credit_limit, current_balance, payment_terms, account_status, last_payment_date, notes } = req.body;
    await pool.query(
      'UPDATE b2b_accounts SET credit_limit=?,current_balance=?,payment_terms=?,account_status=?,last_payment_date=?,notes=? WHERE id=?',
      [credit_limit || 0, current_balance || 0, payment_terms || 'Net 30', account_status || 'Active', last_payment_date || null, notes || '', req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM b2b_accounts WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── SAVED KITS ──────────────────────────────────────────────────────────────
router.get('/kits', protect, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM saved_kits ORDER BY created_at DESC');
    res.json({ kits: rows, total: rows.length });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/kits', protect, async (req, res) => {
  try {
    const { kit_name, customer_name, facility_type, items, total_amount } = req.body;
    if (!kit_name || !items) return res.status(400).json({ message: 'kit_name and items are required' });
    const share_token = crypto.randomBytes(16).toString('hex');
    const [result] = await pool.query(
      'INSERT INTO saved_kits (kit_name,customer_name,facility_type,items,total_amount,share_token,created_by) VALUES (?,?,?,?,?,?,?)',
      [kit_name, customer_name || '', facility_type || '', JSON.stringify(items), total_amount || 0, share_token, req.user?.user_id || null]
    );
    const [rows] = await pool.query('SELECT * FROM saved_kits WHERE id=?', [result.insertId]);
    const kit = rows[0];
    res.status(201).json({ ...kit, share_url: `/kit-builder?shared=${share_token}` });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/kits/shared/:token', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM saved_kits WHERE share_token=?', [req.params.token]);
    if (!rows[0]) return res.status(404).json({ message: 'Shared kit not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
