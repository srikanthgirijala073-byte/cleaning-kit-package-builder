const Manager = require('../models/Manager');
const Staff = require('../models/Staff');

// =======================================================
// Managers
// =======================================================

// POST /api/admin/managers
const createManager = async (req, res) => {
  try {
    const { name, email, password, phone, status } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const existing = await Manager.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A manager with this email already exists.' });
    }

    const manager = await Manager.create({
      name,
      email: email.trim().toLowerCase(),
      password,
      phone: phone || '',
      status: status === 'inactive' ? 'inactive' : 'active',
    });

    return res.status(201).json({ success: true, message: 'Manager created successfully.', manager });
  } catch (error) {
    console.error('Create manager error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create manager.' });
  }
};

// GET /api/admin/managers
const listManagers = async (req, res) => {
  try {
    const managers = await Manager.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, managers });
  } catch (error) {
    console.error('List managers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch managers.' });
  }
};

// PATCH /api/admin/managers/:id/status
const updateManagerStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be "active" or "inactive".' });
    }

    const manager = await Manager.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
    if (!manager) {
      return res.status(404).json({ success: false, message: 'Manager not found.' });
    }

    return res.status(200).json({ success: true, message: 'Manager status updated.', manager });
  } catch (error) {
    console.error('Update manager status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update manager status.' });
  }
};

// DELETE /api/admin/managers/:id
const deleteManager = async (req, res) => {
  try {
    const manager = await Manager.findByIdAndDelete(req.params.id);
    if (!manager) {
      return res.status(404).json({ success: false, message: 'Manager not found.' });
    }
    return res.status(200).json({ success: true, message: 'Manager deleted.' });
  } catch (error) {
    console.error('Delete manager error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete manager.' });
  }
};

// =======================================================
// Staff
// =======================================================

// POST /api/admin/staff
const createStaff = async (req, res) => {
  try {
    const { name, email, password, department, phone, status } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const existing = await Staff.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A staff member with this email already exists.' });
    }

    const staff = await Staff.create({
      name,
      email: email.trim().toLowerCase(),
      password,
      department: department || '',
      phone: phone || '',
      status: status === 'inactive' ? 'inactive' : 'active',
    });

    return res.status(201).json({ success: true, message: 'Staff created successfully.', staff });
  } catch (error) {
    console.error('Create staff error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create staff.' });
  }
};

// GET /api/admin/staff
const listStaff = async (req, res) => {
  try {
    const staff = await Staff.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, staff });
  } catch (error) {
    console.error('List staff error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch staff.' });
  }
};

// PATCH /api/admin/staff/:id/status
const updateStaffStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be "active" or "inactive".' });
    }

    const staff = await Staff.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    return res.status(200).json({ success: true, message: 'Staff status updated.', staff });
  } catch (error) {
    console.error('Update staff status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update staff status.' });
  }
};

// DELETE /api/admin/staff/:id
const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }
    return res.status(200).json({ success: true, message: 'Staff deleted.' });
  } catch (error) {
    console.error('Delete staff error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete staff.' });
  }
};

module.exports = {
  createManager,
  listManagers,
  updateManagerStatus,
  deleteManager,
  createStaff,
  listStaff,
  updateStaffStatus,
  deleteStaff,
};
