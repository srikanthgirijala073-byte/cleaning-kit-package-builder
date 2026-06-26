const express = require('express');
const router = express.Router();

const { protect, authorizePortal } = require('../middleware/rbacAuth');
const contractPricingController = require('../controllers/contractPricingController');

/**
 * Contract Pricing screen
 * -----------------------------------------------------------------
 * GET /api/contract-pricing/:customerId
 *
 * Only admin / manager / dealer_contract roles may view this — a
 * plain 'dealer' is rejected by authorizePortal('CONTRACT_PRICING')
 * with a clear "needs contract-pricing access enabled" message.
 * See config/portalPermissions.js -> PORTALS.CONTRACT_PRICING.
 */
router.get('/:customerId', protect, authorizePortal('CONTRACT_PRICING'), contractPricingController.getContractPricing);

module.exports = router;
