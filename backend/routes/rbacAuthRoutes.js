const express = require('express');
const router = express.Router();

const { adminLogin, managerLogin, staffLogin, getMe } = require('../controllers/rbacAuthController');
const { protect } = require('../middleware/rbacAuth');

// =======================
// POST /api/auth/admin/login
// =======================
router.post('/admin/login', adminLogin);

// =======================
// POST /api/auth/manager/login
// =======================
router.post('/manager/login', managerLogin);

// =======================
// POST /api/auth/staff/login
// =======================
router.post('/staff/login', staffLogin);

// =======================
// GET /api/auth/rbac/me
// Validates the stored token on app refresh
// =======================
router.get('/rbac/me', protect, getMe);

module.exports = router;
