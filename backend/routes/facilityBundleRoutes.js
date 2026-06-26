const express = require('express');
const router = express.Router();

const { protect, authorizePortal } = require('../middleware/rbacAuth');
const productController = require('../controllers/productController');

/**
 * Cleaning Kit Workflow — bundle preview
 * -----------------------------------------------------------------
 * GET /api/facility-bundle/preview?facility_type=Hospital&facility_size=Medium
 * See services/bundlingService.js for the business-rule implementation
 * and config/facilityProductMap.js for the dependency mapping.
 */
router.get('/preview', protect, authorizePortal('FACILITY_BUNDLE_PREVIEW'), productController.previewFacilityBundle);

module.exports = router;
