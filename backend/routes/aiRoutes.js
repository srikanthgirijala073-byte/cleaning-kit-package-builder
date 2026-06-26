var express = require("express");
var router = express.Router();
var aiController = require("../controllers/aiController");
var { authenticate } = require("../middleware/auth");

router.get("/insights", authenticate, aiController.getInsights);
router.get("/alerts", authenticate, aiController.getAlerts);
router.get("/recommendations", authenticate, aiController.getRecommendations);
router.get("/summary", authenticate, aiController.getSummary);
router.get("/messages", authenticate, aiController.getMessages);
router.get("/recommend-kit", authenticate, aiController.getRecommendation);

module.exports = router;
