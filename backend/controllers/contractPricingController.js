const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * contractPricingController.js
 * -----------------------------------------------------------------
 * "Step 1: Data Entry — Contract Pricing screen". Backs
 * GET /api/contract-pricing/:customerId, gated by
 * rbacAuth.authorizePortal('CONTRACT_PRICING') (admin / manager /
 * dealer_contract only — see config/portalPermissions.js).
 *
 * Pricing tier is derived from the customer's historical order volume
 * (lifetime spend with the company so far), which is a simple,
 * deterministic stand-in for a real negotiated-contract table. Swap
 * `resolveDiscountTier()` for a lookup against a dedicated
 * `contract_pricing` table if/when contracts need to be negotiated
 * per-customer rather than derived from order history.
 */

const DISCOUNT_TIERS = [
  { tier: 'Platinum', minLifetimeSpend: 100000, discountPercent: 20 },
  { tier: 'Gold', minLifetimeSpend: 50000, discountPercent: 15 },
  { tier: 'Silver', minLifetimeSpend: 20000, discountPercent: 10 },
  { tier: 'Standard', minLifetimeSpend: 0, discountPercent: 5 },
];

function resolveDiscountTier(lifetimeSpend) {
  for (const tier of DISCOUNT_TIERS) {
    if (lifetimeSpend >= tier.minLifetimeSpend) return tier;
  }
  return DISCOUNT_TIERS[DISCOUNT_TIERS.length - 1];
}

const contractPricingController = {
  /**
   * GET /api/contract-pricing/:customerId
   */
  async getContractPricing(req, res, next) {
    try {
      const { customerId } = req.params;

      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found.' });
      }

      // Lifetime spend = sum of this customer's orders to date.
      const orders = await Order.findAll({ customer_id: customerId, limit: 1000 });
      const lifetimeSpend = orders.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);

      const { tier, discountPercent } = resolveDiscountTier(lifetimeSpend);

      const products = await Product.findAll({ limit: 500 });
      const pricedCatalog = products.map((p) => {
        const listPrice = parseFloat(p.price) || 0;
        const contractPrice = Math.round(listPrice * (1 - discountPercent / 100) * 100) / 100;
        return {
          product_id: p.product_id,
          name: p.name,
          category: p.category,
          listPrice,
          contractPrice,
          discountPercent,
        };
      });

      res.json({
        customer: { customer_id: customer.customer_id, name: customer.name, company: customer.company },
        pricingTier: tier,
        discountPercent,
        lifetimeSpend,
        orderCount: orders.length,
        catalog: pricedCatalog,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = contractPricingController;
