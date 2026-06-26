const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/stats', dashboardController.getStats);
router.get('/charts', authMiddleware, dashboardController.getCharts);
router.get('/recent-orders', authMiddleware, dashboardController.getRecentOrders);

module.exports = router;
