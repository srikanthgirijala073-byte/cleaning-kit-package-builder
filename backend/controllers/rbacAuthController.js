const bcrypt = require('bcryptjs');
const Manager = require('../models/Manager');
const Staff = require('../models/Staff');
const { generateRbacToken } = require('../utils/rbacToken');
require('dotenv').config();

// The Super Admin account is fixed and not stored in any database.
// Values can be overridden via environment variables, but default to
// the exact credentials specified in the requirements so the system
// works out of the box.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'srikanthgirijala073@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '741852';

// =======================================================
// POST /api/auth/admin/login
// =======================================================
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, message: 'Invalid Admin credentials.' });
    }

    const token = generateRbacToken({ userId: 'super-admin', email: ADMIN_EMAIL, role: 'admin' });

    return res.status(200).json({
      success: true,
      token,
      role: 'admin',
      message: 'Login successful.',
      user: { email: ADMIN_EMAIL, role: 'admin', name: 'Super Admin' },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

// =======================================================
// POST /api/auth/manager/login
// =======================================================
const managerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const manager = await Manager.findOne({ email: email.trim().toLowerCase() });

    if (!manager) {
      return res.status(401).json({ success: false, message: 'Invalid Manager credentials.' });
    }

    if (manager.status !== 'active') {
      return res.status(401).json({ success: false, message: 'Invalid Manager credentials.' });
    }

    const isMatch = await manager.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Manager credentials.' });
    }

    const token = generateRbacToken({ userId: manager._id.toString(), email: manager.email, role: 'manager' });

    return res.status(200).json({
      success: true,
      token,
      role: 'manager',
      message: 'Login successful.',
      user: { id: manager._id, name: manager.name, email: manager.email, role: 'manager' },
    });
  } catch (error) {
    console.error('Manager login error:', error);
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

// =======================================================
// POST /api/auth/staff/login
// =======================================================
const staffLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const staff = await Staff.findOne({ email: email.trim().toLowerCase() });

    if (!staff) {
      return res.status(401).json({ success: false, message: 'Invalid Staff credentials.' });
    }

    if (staff.status !== 'active') {
      return res.status(401).json({ success: false, message: 'Invalid Staff credentials.' });
    }

    const isMatch = await staff.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Staff credentials.' });
    }

    const token = generateRbacToken({
      userId: staff._id.toString(),
      email: staff.email,
      role: 'staff',
      department: staff.department || '',
    });

    return res.status(200).json({
      success: true,
      token,
      role: 'staff',
      message: 'Login successful.',
      user: { id: staff._id, name: staff.name, email: staff.email, department: staff.department, role: 'staff' },
    });
  } catch (error) {
    console.error('Staff login error:', error);
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

// =======================================================
// GET /api/auth/rbac/me  (any authenticated admin/manager/staff)
// Used by the frontend to confirm a stored token is still valid
// after a page refresh.
// =======================================================
const getMe = async (req, res) => {
  return res.status(200).json({ success: true, user: req.rbacUser });
};

module.exports = { adminLogin, managerLogin, staffLogin, getMe, ADMIN_EMAIL };
