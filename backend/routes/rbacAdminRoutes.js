const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/rbacAuth');
const {
  createManager,
  listManagers,
  updateManagerStatus,
  deleteManager,
  createStaff,
  listStaff,
  updateStaffStatus,
  deleteStaff,
} = require('../controllers/rbacAdminController');

// All routes below require a valid admin token
router.use(protect, authorize('admin'));

// Managers
router.post('/managers', createManager);
router.get('/managers', listManagers);
router.patch('/managers/:id/status', updateManagerStatus);
router.delete('/managers/:id', deleteManager);

// Staff
router.post('/staff', createStaff);
router.get('/staff', listStaff);
router.patch('/staff/:id/status', updateStaffStatus);
router.delete('/staff/:id', deleteStaff);

module.exports = router;
