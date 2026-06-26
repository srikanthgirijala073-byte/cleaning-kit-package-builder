var aiEngine = require("../utils/aiEngine");
var Product = require("../models/Product");
var { buildFacilityBundle } = require("../services/bundlingService");
var { getRulesForFacility, normalizeFacilityType } = require("../config/facilityProductMap");

exports.getInsights = async function(req, res) {
  try {
    var insights = await aiEngine.getAllInsights();
    res.json(insights);
  } catch(err) { res.status(500).json({ message: err.message }); }
};

exports.getAlerts = async function(req, res) {
  try {
    var alerts = await aiEngine.getSystemAlerts();
    res.json(alerts);
  } catch(err) { res.status(500).json({ message: err.message }); }
};

exports.getRecommendations = async function(req, res) {
  try {
    var reorder = await aiEngine.getReorderRecommendations();
    var popular = await aiEngine.getPopularProducts();
    res.json({ reorder: reorder, popular: popular });
  } catch(err) { res.status(500).json({ message: err.message }); }
};

exports.getSummary = async function(req, res) {
  try {
    var daily = await aiEngine.getDailySummary();
    var orders = await aiEngine.getOrderSummary();
    res.json({ daily: daily, orders: orders });
  } catch(err) { res.status(500).json({ message: err.message }); }
};

exports.getMessages = async function(req, res) {
  try {
    var messages = await aiEngine.getAutoMessages();
    res.json(messages);
  } catch(err) { res.status(500).json({ message: err.message }); }
};

/**
 * getRecommendation(facilityType)
 * -----------------------------------------------------------------
 * Step 4: rule-based recommendation engine.
 *
 * Framework-agnostic core function (no req/res) so it's directly unit
 * testable and reusable from other call sites (e.g. a chatbot endpoint,
 * a batch job) without going through Express. The facility-type -> product
 * category mapping itself lives in config/facilityProductMap.js — re-used
 * here rather than redefined, both to follow DRY and because that map's
 * category strings are the ones that actually exist in the `products`
 * table (see that file's header comment); inventing a second, slightly
 * different mapping here would silently match zero real products.
 *
 * @param {string} facilityType e.g. 'Hospital', 'Office', 'Hotel', 'Home'
 *   (aliases like 'Hospital' -> 'Healthcare' are resolved automatically)
 * @returns {Promise<{
 *   facilityType: string,
 *   recommendedCategories: string[],
 *   recommendedKit: { items: object[], totalAmount: number, totalQuantity: number },
 *   warning?: string
 * }>}
 */
async function getRecommendation(facilityType) {
  var rules = getRulesForFacility(facilityType);

  if (!rules) {
    return {
      facilityType: normalizeFacilityType(facilityType) || facilityType || null,
      recommendedCategories: [],
      recommendedKit: { items: [], totalAmount: 0, totalQuantity: 0 },
      warning: 'No recommendation rule is configured for facility type "' + facilityType + '".',
    };
  }

  // Pull the catalog and let the bundling engine match + score products
  // against this facility's preferred categories/product names.
  var products = await Product.findAll({ limit: 500 });
  var bundle = buildFacilityBundle({ facilityType: facilityType, products: products });

  return {
    facilityType: bundle.facilityType,
    recommendedCategories: rules.categories,
    recommendedKit: {
      items: bundle.items,
      totalAmount: bundle.totalAmount,
      totalQuantity: bundle.totalQuantity,
    },
    warning: bundle.warning,
  };
}

// Express handler wrapping the core function above.
// GET /api/ai/recommend-kit?facilityType=Hospital
exports.getRecommendation = async function(req, res) {
  try {
    var facilityType = req.query.facilityType || req.body.facilityType;

    if (!facilityType) {
      return res.status(400).json({ message: 'facilityType is required (e.g. Hospital, Office, Hotel, Home).' });
    }

    var recommendation = await getRecommendation(facilityType);

    if (recommendation.recommendedKit.items.length === 0) {
      return res.status(404).json({
        message: recommendation.warning || 'No in-stock products match this facility type right now.',
        recommendation: recommendation,
      });
    }

    res.json({ message: 'Recommended kit generated successfully', recommendation: recommendation });
  } catch(err) { res.status(500).json({ message: err.message }); }
};

// Exposed alongside the Express handler so other code (services, tests,
// a future chatbot controller) can call the pure function directly.
exports.buildRecommendation = getRecommendation;
