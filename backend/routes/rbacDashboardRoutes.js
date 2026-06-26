const express = require('express');
const router = express.Router();

const { protect, authorize, authorizePortal } = require('../middleware/rbacAuth');
const dashboardController = require('../controllers/dashboardController');

/**
 * Role-aware RBAC dashboard
 * -----------------------------------------------------------------
 * GET /api/rbac-dashboard/my-queue
 *   Step 5 — Role-Based Aggregation. Returns the order queue relevant
 *   to the signed-in admin/manager/staff member (filtered by
 *   department for staff — Warehouse -> 'Pending Packing', Sales ->
 *   'Visit Scheduled'). See dashboardController.getRoleBasedQueue.
 *
 * GET /api/rbac-dashboard/orders/:orderId/history
 *   Step 5 — Action History. Who changed this order, and when.
 *   See dashboardController.getOrderActionHistory + models/AuditLog.js.
 */
router.get('/my-queue', protect, authorizePortal('RBAC_DASHBOARD_QUEUE'), dashboardController.getRoleBasedQueue);

router.get(
  '/orders/:orderId/history',
  protect,
  authorize('admin', 'manager', 'staff'),
  dashboardController.getOrderActionHistory
);

module.exports = router;
