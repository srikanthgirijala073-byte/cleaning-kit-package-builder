const express = require('express');
const router = express.Router();

const { protect, authorizePortal } = require('../middleware/rbacAuth');
const orderController = require('../controllers/orderController');

/**
 * Bulk Order Portal
 * -----------------------------------------------------------------
 * POST /api/bulk-order
 * See config/portalPermissions.js -> PORTALS.BULK_ORDER for the
 * model mapping and allowed-roles list, and
 * controllers/orderController.createBulkOrder for the implementation.
 */
router.post('/', protect, authorizePortal('BULK_ORDER'), orderController.createBulkOrder);

module.exports = router;
