/**
 * bundlingService.js
 * -----------------------------------------------------------------
 * "Step 3: Cleaning Kit Workflow (Bundling)" — the business-rules
 * function that decides *what* goes into a facility's cleaning kit.
 *
 * Deliberately framework/DB-agnostic: it takes an already-fetched list
 * of products and returns a recommendation. This makes it trivial to
 * unit test (no MySQL connection required) and reusable from multiple
 * call sites (productController's preview endpoint, orderController's
 * order-creation endpoint) without duplicating the matching logic.
 */

const {
  getRulesForFacility,
  getSizeMultiplier,
  normalizeFacilityType,
} = require('../config/facilityProductMap');

/**
 * Scores how well a product matches the facility's preferred product
 * names. Higher is better. 0 means "matched only by category".
 */
function productNameScore(product, preferredProductNames) {
  if (!preferredProductNames || preferredProductNames.length === 0) return 0;
  const name = String(product.name || '').toLowerCase();
  for (let i = 0; i < preferredProductNames.length; i += 1) {
    if (name.includes(preferredProductNames[i].toLowerCase())) {
      // Earlier entries in preferredProductNames are weighted higher,
      // matching the order they're listed in the business rule.
      return preferredProductNames.length - i;
    }
  }
  return 0;
}

/**
 * buildFacilityBundle({ facilityType, facilitySize, products, focusAreas })
 * -----------------------------------------------------------------
 * facilityType  - e.g. 'Hospital', 'Healthcare', 'Office', 'Corporate'
 * facilitySize  - 'Small' | 'Medium' | 'Large'
 * products      - array of product rows as returned by Product.findAll()
 *                  (expects: product_id, name, category, price, stock, image)
 * focusAreas    - optional array of category names to restrict to
 *
 * Returns: { facilityType, facilitySize, items, totalAmount, totalQuantity }
 * where `items` is sorted by relevance (literal product-name matches
 * from the business rule first, then everything else in the target
 * categories).
 */
function buildFacilityBundle({ facilityType, facilitySize, products = [], focusAreas = [] } = {}) {
  const canonicalFacilityType = normalizeFacilityType(facilityType);
  const rules = getRulesForFacility(facilityType);

  if (!rules) {
    return {
      facilityType: canonicalFacilityType || facilityType || null,
      facilitySize: facilitySize || null,
      items: [],
      totalAmount: 0,
      totalQuantity: 0,
      warning: `No bundling rule is defined for facility type "${facilityType}".`,
    };
  }

  const targetCategories =
    Array.isArray(focusAreas) && focusAreas.length > 0
      ? focusAreas
      : rules.categories;

  const multiplier = getSizeMultiplier(facilitySize);

  const matched = products
    .filter((p) => targetCategories.includes(p.category) && Number(p.stock) > 0)
    .map((p) => {
      const price = parseFloat(p.price) || 0;
      const quantity = Math.min(multiplier, Number(p.stock));
      return {
        product_id: p.product_id,
        name: p.name,
        category: p.category,
        image: p.image,
        price,
        quantity,
        subtotal: price * quantity,
        relevance: productNameScore(p, rules.preferredProductNames),
      };
    })
    // Literal business-rule matches (e.g. "Disinfectant", "Glass Cleaner")
    // surface first, so the kit visibly reflects the named rule.
    .sort((a, b) => b.relevance - a.relevance);

  const totalAmount = matched.reduce((sum, item) => sum + item.subtotal, 0);
  const totalQuantity = matched.reduce((sum, item) => sum + item.quantity, 0);

  return {
    facilityType: canonicalFacilityType,
    facilitySize: facilitySize || null,
    items: matched.map(({ relevance, ...rest }) => rest), // relevance is an internal sort key only
    totalAmount,
    totalQuantity,
  };
}

module.exports = { buildFacilityBundle };
