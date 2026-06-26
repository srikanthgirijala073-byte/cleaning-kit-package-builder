const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { roleMiddleware } = require('../middleware/roleMiddleware');

router.get('/', inventoryController.getInventory);
router.get('/low-stock', inventoryController.getLowStockAlerts);
router.put('/:id', authMiddleware, roleMiddleware('admin', 'manager'), inventoryController.updateInventory);

module.exports = router;
