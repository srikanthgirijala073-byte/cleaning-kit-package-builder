const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { roleMiddleware } = require('../middleware/roleMiddleware');

router.get('/sales', authMiddleware, roleMiddleware('admin', 'manager'), reportController.getSalesReport);
router.get('/revenue', authMiddleware, roleMiddleware('admin', 'manager'), reportController.getRevenueReport);
router.get('/inventory', authMiddleware, roleMiddleware('admin', 'manager'), reportController.getInventoryReport);

module.exports = router;
