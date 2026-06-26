/**
 * facilityProductMap.js
 * -----------------------------------------------------------------
 * "Step 3: Cleaning Kit Workflow (Bundling)" — the dependency mapping
 * that defines which products belong to which facility type.
 *
 * The KitBuilder screen (frontend/src/pages/KitBuilder.jsx) already
 * collects facility_type as one of: Healthcare, Hospitality,
 * Corporate, Residential. Those map 1:1 onto the more colloquial
 * names used in conversation (Hospital, Hotel, Office, Home) via
 * FACILITY_TYPE_ALIASES below, so "Hospital" and "Healthcare" always
 * resolve to the exact same bundle.
 *
 * Two levels of specificity are supported:
 *   - CATEGORY rules: broad product categories that exist in the
 *     `products.category` column today (Cleaning Liquid, Cleaning
 *     Spray, Bathroom Cleaner, Hand Care, Cleaning Tools, Paper
 *     Products).
 *   - PRODUCT_NAME rules: specific product names to prefer within a
 *     category when more than one product matches (e.g. for
 *     Healthcare we prefer a literal "Disinfectant" or "Sanitizer"
 *     product over a generic one in the same category, matching the
 *     business rule "Hospital -> Disinfectant + PPE + Floor Cleaner").
 */

// Normalizes conversational facility names to the canonical values
// already used by the orders.facility_type column and the KitBuilder UI.
const FACILITY_TYPE_ALIASES = {
  hospital: 'Healthcare',
  clinic: 'Healthcare',
  healthcare: 'Healthcare',
  hotel: 'Hospitality',
  restaurant: 'Hospitality',
  hospitality: 'Hospitality',
  office: 'Corporate',
  'office space': 'Corporate',
  corporate: 'Corporate',
  home: 'Residential',
  house: 'Residential',
  residential: 'Residential',
};

function normalizeFacilityType(facilityType) {
  if (!facilityType) return null;
  const key = String(facilityType).trim().toLowerCase();
  return FACILITY_TYPE_ALIASES[key] || facilityType;
}

/**
 * FACILITY_PRODUCT_RULES
 * For each canonical facility type:
 *   - categories: product categories to include in the bundle
 *   - preferredProductNames: specific product names to prioritize
 *     within those categories when building the kit (case-insensitive,
 *     partial match), reflecting literal business rules such as
 *     "Hospital -> Disinfectant + PPE + Floor Cleaner".
 */
const FACILITY_PRODUCT_RULES = {
  Healthcare: {
    categories: ['Cleaning Liquid', 'Cleaning Spray', 'Bathroom Cleaner', 'Hand Care'],
    // Disinfectant -> Cleaning Spray / Bathroom Cleaner family,
    // PPE -> Hand Care (sanitizer/gloves), Floor Cleaner -> Cleaning Liquid
    preferredProductNames: ['Disinfectant', 'Sanitizer', 'PPE', 'Floor Cleaner', 'Surface Cleaner'],
  },
  Hospitality: {
    categories: ['Cleaning Liquid', 'Bathroom Cleaner', 'Hand Care', 'Cleaning Spray', 'Cleaning Tools', 'Paper Products'],
    preferredProductNames: ['Floor Cleaner', 'Toilet Cleaner', 'Hand Wash', 'Glass Cleaner', 'Tissue Roll'],
  },
  Corporate: {
    categories: ['Hand Care', 'Cleaning Spray', 'Cleaning Liquid'],
    // Office -> Glass Cleaner + Surface Polish
    preferredProductNames: ['Glass Cleaner', 'Surface Polish', 'Surface Cleaner', 'Sanitizer'],
  },
  Residential: {
    categories: ['Cleaning Liquid', 'Bathroom Cleaner', 'Cleaning Spray'],
    preferredProductNames: ['Floor Cleaner', 'Toilet Cleaner', 'Glass Cleaner'],
  },
};

// Multiplier applied to each matched product's available stock to derive
// a recommended order quantity. Mirrors the multipliers already used in
// orderController.processFacilityBundle so both code paths agree.
const FACILITY_SIZE_MULTIPLIERS = {
  small: 2,
  medium: 5,
  large: 10,
};

function getSizeMultiplier(facilitySize) {
  const key = String(facilitySize || '').trim().toLowerCase();
  return FACILITY_SIZE_MULTIPLIERS[key] || FACILITY_SIZE_MULTIPLIERS.medium;
}

function getRulesForFacility(facilityType) {
  const canonical = normalizeFacilityType(facilityType);
  return FACILITY_PRODUCT_RULES[canonical] || null;
}

module.exports = {
  FACILITY_TYPE_ALIASES,
  FACILITY_PRODUCT_RULES,
  FACILITY_SIZE_MULTIPLIERS,
  normalizeFacilityType,
  getSizeMultiplier,
  getRulesForFacility,
};
